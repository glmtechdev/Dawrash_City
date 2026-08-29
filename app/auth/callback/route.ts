/**
 * /auth/callback
 *
 * Supabase redirects here after the user clicks the magic link.
 * This route exchanges the one-time code for a session, then
 * sends the user to the correct page:
 *
 *   - New member (no saved plots yet) → /onboarding/plots
 *   - Returning member                → /dashboard
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` param lets us override the redirect destination
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Determine whether this is a first-time sign-in.
      // We check for the onboarding_complete flag stored in user metadata.
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const isNewMember = !user?.user_metadata?.onboarding_complete
      const redirectTo = isNewMember ? '/onboarding/plots' : next

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }

    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  }

  // Something went wrong — send back to register with an error flag
  return NextResponse.redirect(`${origin}/register?error=link_expired`)
}
