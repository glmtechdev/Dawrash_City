'use server'

/**
 * Server Actions for Dawrash City auth flow.
 *
 * checkMembership  — validates email against the GLM Members DB bridge,
 *                    then sends a Supabase OTP magic link if allowed.
 *
 * resendMagicLink  — resends the OTP link to the same email.
 */

import { checkMemberBridge } from '@/lib/bridge'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/* ------------------------------------------------------------------ */

export type CheckMembershipResult =
  | { status: 'not_member' }
  | { status: 'error'; message: string }
  | { status: 'link_sent'; email: string; full_name: string }

/**
 * 1. Calls the members bridge to confirm the email belongs to a GLM member.
 * 2. If allowed, triggers a Supabase OTP magic-link email so the member
 *    can sign in without a password.
 */
export async function checkMembership(
  email: string,
): Promise<CheckMembershipResult> {
  const normalised = email.trim().toLowerCase()

  // Step 1 — bridge check
  const bridge = await checkMemberBridge(normalised)

  if (!bridge.allowed) {
    // Distinguish between a configuration error and a genuine non-member
    if ('error' in bridge && bridge.error?.startsWith('Bridge')) {
      return { status: 'error', message: 'Verification service is unavailable. Try again shortly.' }
    }
    return { status: 'not_member' }
  }

  // Step 2 — send magic link via Supabase OTP
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: normalised,
    options: {
      // After clicking the link the user lands on /auth/callback which
      // exchanges the token then redirects to /onboarding/plots (new
      // members) or /dashboard (returning members).
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      // Store the member's name so the callback can pre-populate profile
      data: {
        full_name: bridge.full_name,
      },
    },
  })

  if (error) {
    console.error('[actions] Supabase signInWithOtp error:', error.message)
    return { status: 'error', message: 'Could not send login link. Please try again.' }
  }

  return { status: 'link_sent', email: normalised, full_name: bridge.full_name }
}

/* ------------------------------------------------------------------ */

export type ResendResult =
  | { status: 'sent' }
  | { status: 'error'; message: string }

/**
 * Resend the magic-link OTP to the same email.
 * Supabase rate-limits this to 1 request per 60 seconds.
 */
export async function resendMagicLink(email: string): Promise<ResendResult> {
  const supabase = await createSupabaseServerClient()

  // signInWithOtp is idempotent — calling it again re-sends the link.
  // The `resend` API only supports 'signup' | 'email_change' | 'sms' | 'phone_change',
  // so we use signInWithOtp here too.
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error('[actions] Supabase resend error:', error.message)
    return { status: 'error', message: error.message }
  }

  return { status: 'sent' }
}
