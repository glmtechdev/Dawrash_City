'use client'

/**
 * /auth/callback (client-side page)
 *
 * This page handles the Supabase implicit-flow case where the session tokens
 * arrive as a URL hash fragment (#access_token=...&refresh_token=...).
 *
 * Hash fragments are never sent to the server, so the route.ts handler never
 * sees them — they land here instead. This page reads the fragment, calls
 * setSession to establish the session in SSR-compatible cookies, then
 * redirects to the correct destination.
 *
 * The PKCE code flow (?code=...) is still handled by route.ts as normal.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Spinner } from '@/components/ui/spinner'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    async function handleHashTokens() {
      // Parse tokens from the URL hash
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!accessToken || !refreshToken) {
        // No hash tokens — the route.ts handler should have dealt with a ?code param.
        // If we're here without either, something went wrong.
        router.replace('/login?error=link_expired')
        return
      }

      // Exchange the raw tokens for a proper session stored in cookies
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        console.error('[auth/callback page] setSession error:', error.message)
        router.replace('/login?error=session_failed')
        return
      }

      // Determine where to send the user based on their onboarding state
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login?error=session_failed')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .maybeSingle()

      const next = new URLSearchParams(window.location.search).get('next') ?? '/dashboard'
      const destination = !profile?.onboarding_complete ? '/onboarding/plots' : next

      router.replace(destination)
    }

    handleHashTokens()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Spinner className="size-8 text-gold" />
        <p className="text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
