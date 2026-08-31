'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PRICE_PER_PLOT_KOBO } from '@/lib/dawrash-data'

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
 * Update the member's target by changing their selected number of plots.
 * Only allowed while status is 'active' (not yet completed / fully paid).
 * The new plot count must be >= the number of plots already fully paid for
 * to avoid reducing a target the member has already passed.
 */
export async function updateTarget(plots: number): Promise<ActionResult> {
  if (!Number.isInteger(plots) || plots < 1) {
    return { success: false, error: 'Please select at least 1 plot.' }
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'User not authenticated. Please log in via GLM App.' }
  }

  // Fetch current profile to enforce business rules
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plots, status')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return { success: false, error: 'Could not load your profile. Please try again.' }
  }

  if (profile.status === 'completed') {
    return { success: false, error: 'Your target is fully paid - it cannot be changed.' }
  }

  // Prevent lowering plots below what has already been fully confirmed
  const { data: txRows } = await supabase
    .from('transactions')
    .select('amount_kobo, status')
    .eq('member_id', user.id)

  const confirmedKobo = (txRows ?? [])
    .filter((t) => t.status === 'confirmed')
    .reduce((sum: number, t) => sum + Number(t.amount_kobo ?? 0), 0)

  const plotsAlreadyPaid = Math.floor(confirmedKobo / PRICE_PER_PLOT_KOBO)

  if (plots < plotsAlreadyPaid) {
    return {
      success: false,
      error: `You have already paid for ${plotsAlreadyPaid} plot${plotsAlreadyPaid !== 1 ? 's' : ''}. Your new target must be at least ${plotsAlreadyPaid}.`,
    }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ plots })
    .eq('id', user.id)

  if (updateError) {
    console.error('[actions] updateTarget error:', updateError.message)
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

