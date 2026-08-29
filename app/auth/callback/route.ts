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

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Determine application public origin
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";

  const appOrigin = (envSiteUrl && !envSiteUrl.includes("localhost"))
    ? envSiteUrl
    : (host && !host.includes("localhost") ? `${proto}://${host}` : origin);

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

        // Read the existing profile first so we never overwrite onboarding state
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle()

        // Only upsert the identity fields — never touch onboarding_complete so we
        // don't clobber the value written by /auth/glm or the acceptCovenant action.
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              email: user.email!,
              full_name: fullName,
              initials,
              glm_member_id: glmMemberId,
              // Preserve the existing onboarding flag; default false only for brand-new rows
              onboarding_complete: existingProfile?.onboarding_complete ?? false,
            },
            { onConflict: 'id' },
          )

        if (upsertError) {
          console.error('[auth/callback] profile upsert error:', upsertError.message)
        }

        // Redirect: new member hasn't completed onboarding yet
        const isNewMember = !existingProfile?.onboarding_complete
        const redirectTo = isNewMember ? '/onboarding/plots' : next

        return NextResponse.redirect(`${appOrigin}${redirectTo}`)
      }
    }

    console.error('[auth/callback] session exchange error:', sessionError?.message)
  }

  return NextResponse.redirect(`${appOrigin}/register?error=link_expired`)
}
