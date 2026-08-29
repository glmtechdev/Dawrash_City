'use server'

import { checkMemberBridge } from '@/lib/bridge'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type CheckMembershipResult =
  | { status: 'not_member' }
  | { status: 'error'; message: string }
  | { status: 'link_sent'; email: string; full_name: string }

export async function checkMembership(email: string): Promise<CheckMembershipResult> {
  const normalised = email.trim().toLowerCase()

  const bridge = await checkMemberBridge(normalised)

  if (!bridge.allowed) {
    if ('error' in bridge && bridge.error) {
      return { status: 'error', message: 'Verification service is unavailable. Try again shortly.' }
    }
    return { status: 'not_member' }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: normalised,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      shouldCreateUser: true,
      data: {
        full_name: bridge.full_name,
        glm_member_id: bridge.member_id ?? null,
      },
    },
  })

  if (error) {
    console.error('[actions] signInWithOtp error:', error.message, error.status)
    return { status: 'error', message: error.message }
  }

  return { status: 'link_sent', email: normalised, full_name: bridge.full_name }
}

export type ResendResult =
  | { status: 'sent' }
  | { status: 'error'; message: string }

export async function resendMagicLink(email: string): Promise<ResendResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      shouldCreateUser: false,
    },
  })

  if (error) {
    return { status: 'error', message: error.message }
  }

  return { status: 'sent' }
}
