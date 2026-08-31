import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { fetchAdminMembers } from '@/app/admin/actions'
import { AdminClient } from '@/app/admin/admin-client'

/**
 * Admin page - server component.
 * Middleware already blocks non-admins, but we double-check here for safety
 * before fetching all member data with the service-role client.
 */
export default async function AdminPage() {
  // ── Dev bypass — no Supabase calls needed ───────────────────────
  // When DEV_FORCE_EMAIL is set, middleware already let us through.
  // Skip auth checks and load members (which also has a dev fallback).
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_FORCE_EMAIL?.trim()
  ) {
    const members = await fetchAdminMembers()
    return <AdminClient members={members} />
  }

  // ── Production path ──────────────────────────────────────────────
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

  if (!(profile?.is_admin || profile?.is_superadmin)) redirect('/dashboard')

  const members = await fetchAdminMembers()

  return <AdminClient members={members} />
}
