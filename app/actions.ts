'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Record acceptance of the Dawrash Covenant and complete member onboarding.
 *
 * Called from /onboarding/covenant on covenant sign.
 * Sets covenant_signed_at, status = 'active', and onboarding_complete = true.
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

/**
 * Application fields for the "Apply for More" second-plot request.
 */
export type PlotApplicationInput = {
  fullName: string
  phoneNumber: string
  pastorName: string
  auxanoCenter: string
  residentialAddress: string
  occupation: string
}

/**
 * Submit an "Apply for More" application for a second personal plot.
 *
 * Eligibility:
 *   - Member's status must be 'completed' (full payment confirmed for plot 1)
 *   - No existing pending application
 *
 * On success, inserts a row into target_increase_requests with status = 'pending'.
 * The application is reviewed by admin who can approve (sets plots = 2) or reject.
 */
export async function submitPlotApplication(
  input: PlotApplicationInput,
): Promise<ActionResult> {
  // Basic validation
  const requiredFields: (keyof PlotApplicationInput)[] = [
    'fullName',
    'phoneNumber',
    'pastorName',
    'auxanoCenter',
    'residentialAddress',
    'occupation',
  ]
  for (const field of requiredFields) {
    if (!input[field]?.trim()) {
      return { success: false, error: 'All fields are required. Please fill in the form completely.' }
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'User not authenticated. Please log in via GLM App.' }
  }

  // Fetch current profile to enforce eligibility
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plots, status')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return { success: false, error: 'Could not load your profile. Please try again.' }
  }

  if (profile.status !== 'completed') {
    return {
      success: false,
      error: 'You can only apply for a second plot after completing full payment for your first plot.',
    }
  }

  if (profile.plots >= 2) {
    return {
      success: false,
      error: 'You already hold the maximum of 2 personal plots.',
    }
  }

  // Block duplicate pending applications
  const { data: existingApplications, error: checkError } = await supabase
    .from('target_increase_requests')
    .select('id, status')
    .eq('member_id', user.id)
    .eq('status', 'pending')

  if (checkError) {
    console.error('[actions] submitPlotApplication pending check error:', checkError.message)
    return { success: false, error: 'Could not verify existing applications. Please try again.' }
  }

  if (existingApplications && existingApplications.length > 0) {
    return {
      success: false,
      error: 'You already have a pending application. Please wait for admin review.',
    }
  }

  const { error: insertError } = await supabase
    .from('target_increase_requests')
    .insert({
      member_id: user.id,
      current_plots: profile.plots,
      requested_plots: 2,
      full_name: input.fullName.trim(),
      phone_number: input.phoneNumber.trim(),
      pastor_name: input.pastorName.trim(),
      auxano_center: input.auxanoCenter.trim(),
      residential_address: input.residentialAddress.trim(),
      occupation: input.occupation.trim(),
    })

  if (insertError) {
    console.error('[actions] submitPlotApplication insert error:', insertError.message)
    return { success: false, error: insertError.message }
  }

  return { success: true }
}
