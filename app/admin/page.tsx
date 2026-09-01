import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { fetchAdminDashboardData } from '@/app/admin/actions'
import { AdminClient } from '@/app/admin/admin-client'

export const dynamic = 'force-dynamic'

/**
 * Superadmin Console - Server Component.
 * Guards access to verified admins/superadmins and fetches
 * live data for all 4 tables (profiles, transactions, audit_flags, certificates).
 */
export default async function AdminPage() {
  // Dev bypass - no Supabase network calls needed
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_FORCE_EMAIL?.trim()
  ) {
    const dashboardData = await fetchAdminDashboardData()
    return <AdminClient initialData={dashboardData} />
  }

  // ── Production session guard ─────────────────────────────────────
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_superadmin')
    .eq('id', user.id)
    .maybeSingle()

  if (!(profile?.is_admin || profile?.is_superadmin)) {
    redirect('/dashboard')
  }

  const dashboardData = await fetchAdminDashboardData()

  return <AdminClient initialData={dashboardData} />
}
