'use server'

import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  type MemberStatus,
  type PaymentStatus,
  members as fallbackMembers,
  auditFlags as fallbackAuditFlags,
} from '@/lib/dawrash-data'
import { revalidatePath } from 'next/cache'

/* ------------------------------------------------------------------ */
/*  Authorization Guard for Admin Actions                             */
/* ------------------------------------------------------------------ */

async function assertAdminSession(): Promise<{ isAuthorized: boolean; error?: string }> {
  // Allow dev bypass when DEV_FORCE_EMAIL is configured on localhost
  if (process.env.NODE_ENV === 'development' && process.env.DEV_FORCE_EMAIL?.trim()) {
    return { isAuthorized: true }
  }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { isAuthorized: false, error: 'Unauthorized: Session expired or invalid.' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, is_superadmin')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !(profile?.is_admin || profile?.is_superadmin)) {
      return { isAuthorized: false, error: 'Unauthorized: Admin privileges required.' }
    }

    return { isAuthorized: true }
  } catch (err: any) {
    return { isAuthorized: false, error: err?.message || 'Authorization check failed.' }
  }
}

/* ------------------------------------------------------------------ */
/*  Database Aligned Types                                            */
/* ------------------------------------------------------------------ */

export type AdminMember = {
  id: string
  name: string
  email: string
  initials: string
  glmMemberId?: string | null
  plots: number
  createdAt: string
  memberSince?: string
  covenantSignedAt: string | null
  nuban?: string | null
  bank?: string | null
  status: MemberStatus
  onboardingComplete: boolean
  isAdmin: boolean
  isSuperadmin: boolean
  transactions: AdminTransaction[]
}

export type AdminTransaction = {
  id: string
  memberId: string
  memberName?: string
  memberEmail?: string
  amountKobo: number
  method: string
  status: PaymentStatus
  reference: string
  paidAt: string
  notes?: string | null
  feeKobo?: number | null
  chargedAmountKobo?: number | null
  intendedAmountKobo?: number | null
  createdAt: string
}

export type AdminAuditFlag = {
  id: string
  transactionId?: string | null
  memberId: string
  memberName?: string
  memberEmail?: string
  reference: string
  expectedKobo: number
  recordedKobo: number
  varianceKobo: number
  note: string
  resolved: boolean
  resolvedAt: string | null
  createdAt: string
}

export type AdminCertificate = {
  id: string
  memberId: string
  memberName?: string
  memberEmail?: string
  plots: number
  plotNumbers: string | null
  issuedAt: string | null
  delivered: boolean
  deliveredAt: string | null
  createdAt: string
}

export type AdminDashboardData = {
  members: AdminMember[]
  transactions: AdminTransaction[]
  auditFlags: AdminAuditFlag[]
  certificates: AdminCertificate[]
}

/* ------------------------------------------------------------------ */
/*  Helper: Derive Member Status                                      */
/* ------------------------------------------------------------------ */

function deriveStatus(profile: {
  status?: string | null
  covenant_signed_at?: string | null
  onboarding_complete?: boolean | null
}): MemberStatus {
  if (profile.status === 'completed') return 'completed'
  if (profile.status === 'active') return 'active'
  if (profile.status === 'pending_covenant') return 'pending_covenant'
  if (!profile.covenant_signed_at) return 'pending_covenant'
  return 'active'
}

/* ------------------------------------------------------------------ */
/*  fetchAdminDashboardData                                           */
/* ------------------------------------------------------------------ */

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const isDevWithForce =
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_FORCE_EMAIL?.trim()

  try {
    const supabase = createSupabaseAdminClient()

    // 1. Fetch Profiles (ordered by created_at)
    const { data: rawProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false, nullsFirst: false })

    if (profilesError) {
      console.warn('[admin/actions] Supabase profiles query error:', profilesError.message)
      if (isDevWithForce) return getFallbackDashboardData()
    }

    // 2. Fetch Transactions
    const { data: rawTransactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (txError) {
      console.warn('[admin/actions] Supabase transactions query error:', txError.message)
    }

    // 3. Fetch Audit Flags
    const { data: rawFlags, error: flagsError } = await supabase
      .from('audit_flags')
      .select('*')
      .order('created_at', { ascending: false })

    if (flagsError) {
      console.warn('[admin/actions] Supabase audit_flags query error:', flagsError.message)
    }

    // 4. Fetch Certificates
    const { data: rawCerts, error: certsError } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false })

    if (certsError) {
      console.warn('[admin/actions] Supabase certificates query error:', certsError.message)
    }

    // If no profiles returned and in dev mode, fallback to demo data
    if ((!rawProfiles || rawProfiles.length === 0) && isDevWithForce) {
      return getFallbackDashboardData()
    }

    const profilesMap = new Map<string, { name: string; email: string; plots: number }>()

    const txByMember = new Map<string, AdminTransaction[]>()
    const mappedTransactions: AdminTransaction[] = (rawTransactions ?? []).map((t) => {
      const tx: AdminTransaction = {
        id: String(t.id),
        memberId: String(t.member_id),
        amountKobo: Number(t.amount_kobo ?? 0),
        method: String(t.method ?? 'Bank Transfer'),
        status: (t.status as PaymentStatus) ?? 'confirmed',
        reference: String(t.reference ?? `TX-${String(t.id).slice(0, 6)}`),
        paidAt: String(t.paid_at ?? t.created_at ?? new Date().toISOString()),
        notes: t.notes ? String(t.notes) : null,
        feeKobo: t.fee_kobo ? Number(t.fee_kobo) : null,
        chargedAmountKobo: t.charged_amount_kobo ? Number(t.charged_amount_kobo) : null,
        intendedAmountKobo: t.intended_amount_kobo ? Number(t.intended_amount_kobo) : null,
        createdAt: String(t.created_at ?? new Date().toISOString()),
      }

      if (!txByMember.has(tx.memberId)) txByMember.set(tx.memberId, [])
      txByMember.get(tx.memberId)!.push(tx)
      return tx
    })

    const mappedMembers: AdminMember[] = (rawProfiles ?? []).map((p) => {
      const fullName = String(p.full_name || p.email?.split('@')[0] || 'Member')
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

      const memberTx = txByMember.get(p.id) ?? []

      profilesMap.set(p.id, {
        name: fullName,
        email: p.email || '',
        plots: Number(p.plots ?? 0),
      })

      return {
        id: p.id,
        name: fullName,
        email: p.email || '',
        initials,
        glmMemberId: p.glm_member_id || null,
        plots: Number(p.plots ?? 0),
        createdAt: trustedCreatedAt,
        memberSince: trustedCreatedAt,
        covenantSignedAt: p.covenant_signed_at || null,
        nuban: p.nuban || null,
        bank: p.bank || null,
        status: deriveStatus(p),
        onboardingComplete: Boolean(p.onboarding_complete),
        isAdmin: Boolean(p.is_admin),
        isSuperadmin: Boolean(p.is_superadmin),
        transactions: memberTx,
      }
    })

    // Attach member names to transactions
    mappedTransactions.forEach((tx) => {
      const memberInfo = profilesMap.get(tx.memberId)
      if (memberInfo) {
        tx.memberName = memberInfo.name
        tx.memberEmail = memberInfo.email
      }
    })

    const mappedFlags: AdminAuditFlag[] = (rawFlags ?? []).map((f) => {
      const memberInfo = profilesMap.get(f.member_id)
      const expected = Number(f.expected_kobo ?? 0)
      const recorded = Number(f.recorded_kobo ?? 0)
      const variance = f.variance_kobo !== undefined && f.variance_kobo !== null
        ? Number(f.variance_kobo)
        : recorded - expected

      return {
        id: String(f.id),
        transactionId: f.transaction_id ? String(f.transaction_id) : null,
        memberId: String(f.member_id),
        memberName: memberInfo?.name ?? 'Unknown Member',
        memberEmail: memberInfo?.email ?? '',
        reference: String(f.reference ?? 'N/A'),
        expectedKobo: expected,
        recordedKobo: recorded,
        varianceKobo: variance,
        note: String(f.note ?? ''),
        resolved: Boolean(f.resolved),
        resolvedAt: f.resolved_at ? String(f.resolved_at) : null,
        createdAt: String(f.created_at ?? new Date().toISOString()),
      }
    })

    const mappedCerts: AdminCertificate[] = (rawCerts ?? []).map((c) => {
      const memberInfo = profilesMap.get(c.member_id)
      return {
        id: String(c.id),
        memberId: String(c.member_id),
        memberName: memberInfo?.name ?? 'Unknown Member',
        memberEmail: memberInfo?.email ?? '',
        plots: memberInfo?.plots ?? 0,
        plotNumbers: c.plot_numbers ? String(c.plot_numbers) : null,
        issuedAt: c.issued_at ? String(c.issued_at) : null,
        delivered: Boolean(c.delivered),
        deliveredAt: c.delivered_at ? String(c.delivered_at) : null,
        createdAt: String(c.created_at ?? new Date().toISOString()),
      }
    })

    return {
      members: mappedMembers,
      transactions: mappedTransactions,
      auditFlags: mappedFlags,
      certificates: mappedCerts,
    }
  } catch (err: any) {
    console.error('[admin/actions] fetchAdminDashboardData error:', err.message)
    if (isDevWithForce) return getFallbackDashboardData()
    return {
      members: [],
      transactions: [],
      auditFlags: [],
      certificates: [],
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Fallback Data Generator for Offline / Local Testing                */
/* ------------------------------------------------------------------ */

function getFallbackDashboardData(): AdminDashboardData {
  const members: AdminMember[] = fallbackMembers.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    initials: m.initials,
    plots: m.plots,
    createdAt: m.memberSince,
    memberSince: m.memberSince,
    covenantSignedAt: m.covenantSignedAt,
    status: m.status,
    onboardingComplete: true,
    isAdmin: m.id === 'mbr_001',
    isSuperadmin: m.id === 'mbr_001',
    transactions: m.transactions.map((t) => ({
      id: t.id,
      memberId: m.id,
      memberName: m.name,
      memberEmail: m.email,
      amountKobo: t.amountKobo,
      method: t.method,
      status: t.status,
      reference: t.reference,
      paidAt: t.date,
      createdAt: t.date,
    })),
  }))

  const transactions: AdminTransaction[] = members.flatMap((m) => m.transactions)

  const auditFlags: AdminAuditFlag[] = fallbackAuditFlags.map((f, i) => ({
    id: f.id,
    memberId: `mbr_00${i + 5}`,
    memberName: f.member,
    reference: f.reference,
    expectedKobo: f.expectedKobo,
    recordedKobo: f.recordedKobo,
    varianceKobo: f.recordedKobo - f.expectedKobo,
    note: f.note,
    resolved: false,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
  }))

  const certificates: AdminCertificate[] = members
    .filter((m) => m.status === 'completed')
    .map((m, index) => ({
      id: `cert_${m.id}`,
      memberId: m.id,
      memberName: m.name,
      memberEmail: m.email,
      plots: m.plots,
      plotNumbers: index === 0 ? 'Plot 104, Block D' : null,
      issuedAt: index === 0 ? new Date().toISOString() : null,
      delivered: false,
      deliveredAt: null,
      createdAt: new Date().toISOString(),
    }))

  return { members, transactions, auditFlags, certificates }
}

/* ------------------------------------------------------------------ */
/*  Legacy alias for backward compatibility                           */
/* ------------------------------------------------------------------ */

export async function fetchAdminMembers(): Promise<AdminMember[]> {
  const data = await fetchAdminDashboardData()
  return data.members
}

/* ------------------------------------------------------------------ */
/*  Server Action: Record Manual / Offline Bank Transfer              */
/* ------------------------------------------------------------------ */

export async function recordManualTransactionAction(input: {
  memberId: string
  amountKobo: number
  method?: string
  reference?: string
  paidAt?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdminSession()
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = createSupabaseAdminClient()
    const reference = input.reference?.trim() || `OFFLINE-${Date.now().toString().slice(-6)}`
    const paidAt = input.paidAt || new Date().toISOString().split('T')[0]

    const { error: txError } = await supabase.from('transactions').insert({
      member_id: input.memberId,
      amount_kobo: input.amountKobo,
      method: input.method || 'Bank Transfer (Direct)',
      status: 'confirmed',
      reference,
      paid_at: paidAt,
      notes: input.notes || 'Recorded manually by Superadmin',
      intended_amount_kobo: input.amountKobo,
      charged_amount_kobo: input.amountKobo,
      fee_kobo: 0,
    })

    if (txError) {
      console.error('[admin/actions] recordManualTransactionAction error:', txError.message)
      return { success: false, error: txError.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record transaction' }
  }
}

/* ------------------------------------------------------------------ */
/*  Server Action: Update Transaction Status                          */
/* ------------------------------------------------------------------ */

export async function updateTransactionStatusAction(
  transactionId: string,
  status: PaymentStatus,
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdminSession()
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('transactions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', transactionId)

    if (error) {
      console.error('[admin/actions] updateTransactionStatusAction error:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update transaction status' }
  }
}

/* ------------------------------------------------------------------ */
/*  Server Action: Issue Certificate with Plot Numbers                */
/* ------------------------------------------------------------------ */

export async function issueCertificateAction(
  memberId: string,
  plotNumbers: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdminSession()
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = createSupabaseAdminClient()
    const now = new Date().toISOString()

    const { error } = await supabase.from('certificates').upsert(
      {
        member_id: memberId,
        plot_numbers: plotNumbers.trim(),
        issued_at: now,
      },
      { onConflict: 'member_id' },
    )

    if (error) {
      console.error('[admin/actions] issueCertificateAction error:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to issue certificate' }
  }
}

/* ------------------------------------------------------------------ */
/*  Server Action: Update Certificate Delivery Status                 */
/* ------------------------------------------------------------------ */

export async function updateCertificateDeliveryAction(
  certificateId: string,
  delivered: boolean,
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdminSession()
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = createSupabaseAdminClient()
    const now = delivered ? new Date().toISOString() : null

    const { error } = await supabase
      .from('certificates')
      .update({ delivered, delivered_at: now })
      .eq('id', certificateId)

    if (error) {
      console.error('[admin/actions] updateCertificateDeliveryAction error:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update delivery status' }
  }
}

/* ------------------------------------------------------------------ */
/*  Server Action: Resolve Audit Flag                                 */
/* ------------------------------------------------------------------ */

export async function resolveAuditFlagAction(
  flagId: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdminSession()
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('audit_flags')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', flagId)

    if (error) {
      console.error('[admin/actions] resolveAuditFlagAction error:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to resolve audit flag' }
  }
}

/* ------------------------------------------------------------------ */
/*  Server Action: Update Member Admin Privilege                      */
/* ------------------------------------------------------------------ */

export async function updateMemberAdminRoleAction(
  memberId: string,
  role: 'is_admin' | 'is_superadmin',
  value: boolean,
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdminSession()
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('profiles')
      .update({ [role]: value, updated_at: new Date().toISOString() })
      .eq('id', memberId)

    if (error) {
      console.error('[admin/actions] updateMemberAdminRoleAction error:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update admin role' }
  }
}

/* ------------------------------------------------------------------ */
/*  Server Action: Update Member Plot Quota                           */
/* ------------------------------------------------------------------ */

export async function updateMemberPlotsAction(
  memberId: string,
  plots: number,
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdminSession()
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('profiles')
      .update({ plots: Math.max(1, plots), updated_at: new Date().toISOString() })
      .eq('id', memberId)

    if (error) {
      console.error('[admin/actions] updateMemberPlotsAction error:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update plot count' }
  }
}

/* ------------------------------------------------------------------ */
/*  Server Action: Cap Plots to MAX_PLOTS for All Existing Members    */
/*                                                                    */
/*  Runs a single bulk UPDATE against the profiles table:             */
/*    UPDATE profiles SET plots = 5 WHERE plots > 5                   */
/*                                                                    */
/*  Members with plots 0–5 are untouched.                             */
/*  Safe to run multiple times (idempotent).                          */
/*                                                                    */
/*  Alternatively, run this SQL directly in your Supabase SQL editor: */
/*    UPDATE public.profiles SET plots = 5 WHERE plots > 5;           */
/* ------------------------------------------------------------------ */

export async function capExistingPlotsToMaxAction(): Promise<{
  success: boolean
  affectedRows?: number
  error?: string
}> {
  const auth = await assertAdminSession()
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = createSupabaseAdminClient()

    // Fetch IDs of members that exceed the cap so we can count affected rows
    const { data: overCap, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .gt('plots', 5)

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    const affectedRows = overCap?.length ?? 0

    if (affectedRows === 0) {
      return { success: true, affectedRows: 0 }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ plots: 5, updated_at: new Date().toISOString() })
      .gt('plots', 5)

    if (updateError) {
      console.error('[admin/actions] capExistingPlotsToMaxAction error:', updateError.message)
      return { success: false, error: updateError.message }
    }

    revalidatePath('/admin')
    return { success: true, affectedRows }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to cap existing plots' }
  }
}
