/**
 * /auth/callback
 *
 * Supabase redirects here after the user clicks the magic link.
 * This route exchanges the one-time code for a session, then:
 *
 *  1. Ensures a profile row exists in public.profiles (upsert).
 *     The handle_new_user() DB trigger normally does this on INSERT
 *     to auth.users, but on subsequent logins the trigger doesn't
 *     fire — so we upsert here to cover both cases.
 *
 *  2. Sends the user to the correct page:
 *       - New member  → /onboarding/plots
 *       - Returning   → /dashboard
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (!sessionError) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const meta = user.user_metadata ?? {}
        const fullName: string =
          meta.full_name ?? user.email?.split('@')[0] ?? 'Member'
        const glmMemberId: string | null = meta.glm_member_id ?? null

        // Derive initials from the first two words of the name
        const parts = fullName.trim().split(' ')
        const initials = (
          (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
        ).toUpperCase()

        // Upsert profile — safe to call on every login.
        // glm_member_id links this Dawrash user back to the GLM Members DB
        // without sharing any credentials or direct DB access.
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              email: user.email!,
              full_name: fullName,
              initials,
              glm_member_id: glmMemberId,
            },
            {
              // Only set these fields on first insert;
              // don't overwrite edits the member or admin made later.
              ignoreDuplicates: false,
              onConflict: 'id',
            },
          )

        if (upsertError) {
          console.error('[auth/callback] profile upsert error:', upsertError.message)
        }

        // Redirect: new member has no plots chosen yet (onboarding_complete = false)
        const isNewMember = !meta.onboarding_complete
        const redirectTo = isNewMember ? '/onboarding/plots' : next

        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
    }

    console.error('[auth/callback] session exchange error:', sessionError?.message)
  }

  return NextResponse.redirect(`${origin}/register?error=link_expired`)
}
