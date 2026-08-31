'use server'

import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  type Member,
  type MemberStatus,
  type Transaction,
} from '@/lib/dawrash-data'

/* ------------------------------------------------------------------ */
/*  Types returned to admin sections                                    */
/* ------------------------------------------------------------------ */

export type AdminMember = Member

export type AdminOverviewData = {
  members: AdminMember[]
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                    */
/* ------------------------------------------------------------------ */

function deriveStatus(profile: {
  status?: string | null
  covenant_signed_at?: string | null
  onboarding_complete?: boolean | null
}): MemberStatus {
  if (profile.status === 'completed') return 'completed'
  if (profile.status === 'active') return 'active'
  if (profile.status === 'pending_covenant') return 'pending_covenant'
  // Derive from fields if status column not yet set
  if (!profile.covenant_signed_at) return 'pending_covenant'
  return 'active'
}

function mapTransactions(rawTx: Record<string, unknown>[]): Transaction[] {
  return rawTx.map((t) => ({
    id: String(t.id ?? ''),
    date: String(t.paid_at ?? t.created_at ?? new Date().toISOString()),
    amountKobo: Number(t.amount_kobo ?? 0),
    method: String(t.method ?? 'Paystack'),
    status: (t.status as Transaction['status']) ?? 'confirmed',
    reference: String(t.reference ?? `DWR-${String(t.id).slice(0, 6)}`),
  }))
}

/* ------------------------------------------------------------------ */
/*  fetchAdminMembers                                                   */
/*  Returns every profile with their full transaction history.          */
/* ------------------------------------------------------------------ */

export async function fetchAdminMembers(): Promise<AdminMember[]> {
  // ── Dev fallback — no Supabase calls needed ──────────────────────
  // When DEV_FORCE_EMAIL is set, return the static demo member list so
  // the admin dashboard renders on localhost without any network access.
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_FORCE_EMAIL?.trim()
  ) {
    const { members } = await import('@/lib/dawrash-data')
    return members as AdminMember[]
  }

  const supabase = createSupabaseAdminClient()

  // Fetch all profiles (service role bypasses RLS).
  // Prefer the trusted created_at timestamp; fall back to member_since only if
  // the column exists in the project schema, but keep the app resilient to
  // legacy rows without it.
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true, nullsFirst: false })

  if (profilesError) {
    console.error('[admin/actions] fetchAdminMembers profiles error:', profilesError.message)
    return []
  }

  if (!profiles || profiles.length === 0) {
    console.warn('[admin/actions] fetchAdminMembers: no profiles returned')
    return []
  }

  console.log(`[admin/actions] fetchAdminMembers: fetched ${profiles.length} profiles`)

  // Fetch all transactions in one query
  const { data: allTx, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .order('paid_at', { ascending: false })

  if (txError) {
    console.error('[admin/actions] fetchAdminMembers transactions error:', txError.message)
  }

  const txByMember = new Map<string, Record<string, unknown>[]>()
  for (const tx of allTx ?? []) {
    const memberId = String(tx.member_id ?? '')
    if (!txByMember.has(memberId)) txByMember.set(memberId, [])
    txByMember.get(memberId)!.push(tx as Record<string, unknown>)
  }

  return profiles.map((p) => {
    const rawTx = txByMember.get(p.id) ?? []
    const transactions = mapTransactions(rawTx)

    const fullName: string = p.full_name || p.email?.split('@')[0] || 'Member'
    const parts = fullName.trim().split(' ')
    const initials =
      p.initials ||
      ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() ||
      'MB'

    const trustedCreatedAt =
      typeof p.created_at === 'string' && p.created_at
        ? p.created_at
        : typeof p.member_since === 'string' && p.member_since
          ? p.member_since
          : new Date().toISOString()

    return {
      id: p.id,
      name: fullName,
      email: p.email || '',
      initials,
      plots: Number(p.plots ?? 0),
      memberSince: trustedCreatedAt,
      covenantSignedAt: p.covenant_signed_at || null,
      nuban: p.nuban || '-',
      bank: p.bank || '-',
      status: deriveStatus(p),
      transactions,
    } satisfies AdminMember
  })
}
