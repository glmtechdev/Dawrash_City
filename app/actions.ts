'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Save the member's selected number of plots during onboarding.
 */
export async function savePlotSelection(plots: number): Promise<ActionResult> {
  if (plots < 1) {
    return { success: false, error: 'Please select at least 1 plot.' }
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'User not authenticated. Please log in via GLM App.' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ plots })
    .eq('id', user.id)

  if (updateError) {
    console.error('[actions] savePlotSelection error:', updateError.message)
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

/**
 * Record acceptance of the Dawrash Covenant and complete member onboarding.
 */
export async function acceptCovenant(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'User not authenticated. Please log in via GLM App.' }
  }

  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      covenant_signed_at: now,
      status: 'active',
      onboarding_complete: true,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('[actions] acceptCovenant error:', updateError.message)
    return { success: false, error: updateError.message }
  }

  // Also update user metadata so future auth callback checks know onboarding is complete
  await supabase.auth.updateUser({
    data: { onboarding_complete: true },
  })

  return { success: true }
}

