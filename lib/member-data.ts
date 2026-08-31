import { createSupabaseServerClient } from '@/lib/supabase/server'
import { currentMember, type Member, type Transaction } from '@/lib/dawrash-data'

/**
 * Fetch the authenticated member's profile and transaction history from Supabase.
 * Falls back to demo member data if no session exists or during initial dev setup.
 */
export async function getCurrentMemberServer(): Promise<Member> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return currentMember
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      const email = user.email ?? currentMember.email
      const fullName = user.user_metadata?.full_name ?? email.split('@')[0]
      const parts = fullName.trim().split(' ')
      const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'MB'

      return {
        ...currentMember,
        id: user.id,
        name: fullName,
        email,
        initials,
      }
    }

    const { data: rawTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('member_id', user.id)
      .order('paid_at', { ascending: false })

    const transactions: Transaction[] = (rawTx ?? []).map((t) => ({
      id: t.id,
      date: t.paid_at ?? t.created_at ?? new Date().toISOString(),
      amountKobo: Number(t.amount_kobo ?? 0),
      method: t.method ?? 'Paystack',
      status: t.status ?? 'confirmed',
      reference: t.reference ?? `DWR-${t.id.slice(0, 4)}`,
    }))

    return {
      id: profile.id,
      name: profile.full_name || user.email?.split('@')[0] || 'Member',
      email: profile.email || user.email || '',
      initials: profile.initials || 'MB',
      plots: profile.plots ?? 0,
      memberSince: profile.created_at || profile.member_since || new Date().toISOString(),
      covenantSignedAt: profile.covenant_signed_at || null,
      nuban: profile.nuban || '0000000000',
      bank: profile.bank || '',
      status: profile.status || (profile.covenant_signed_at ? 'active' : 'pending_covenant'),
      transactions: transactions.length > 0 ? transactions : currentMember.transactions,
    }
  } catch (err) {
    console.error('[member-data] Error fetching member server data:', err)
    return currentMember
  }
}
