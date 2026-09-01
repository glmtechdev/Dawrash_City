'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PAYMENT_PER_PERSONAL_PLOT_KOBO, MAX_PLOTS } from '@/lib/dawrash-data'

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
  if (plots > MAX_PLOTS) {
    return { success: false, error: `You can select a maximum of ${MAX_PLOTS} plots. To request more, apply for a target increase after completing your payments.` }
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
  if (plots > MAX_PLOTS) {
    return { success: false, error: `The maximum self-service target is ${MAX_PLOTS} plots. Apply for a target increase to go beyond this.` }
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

  // Prevent lowering plots below what has already been fully confirmed.
  // A personal plot is fully paid when the member has paid the paired amount
  // (PAYMENT_PER_PERSONAL_PLOT_KOBO = personal ₦1M + church ₦1M = ₦2M).
  const { data: txRows } = await supabase
    .from('transactions')
    .select('amount_kobo, status')
    .eq('member_id', user.id)

  const confirmedKobo = (txRows ?? [])
    .filter((t) => t.status === 'confirmed')
    .reduce((sum: number, t) => sum + Number(t.amount_kobo ?? 0), 0)

  const plotsAlreadyPaid = Math.floor(confirmedKobo / PAYMENT_PER_PERSONAL_PLOT_KOBO)

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
 * Submit a request to increase a member's plot target beyond MAX_PLOTS.
 *
 * Eligibility rule: the member must have status 'completed', meaning they
 * have fully paid for their current plot target, before they can ask for more.
 *
 * The request is stored in the `target_increase_requests` Supabase table
 * (see migration note below) and surfaced to admins for review.
 *
 * Supabase table DDL (run once in your project SQL editor):
 * ─────────────────────────────────────────────────────────
 * create table if not exists public.target_increase_requests (
 *   id              uuid primary key default gen_random_uuid(),
 *   member_id       uuid not null references public.profiles(id) on delete cascade,
 *   current_plots   int  not null,
 *   requested_plots int  not null,
 *   reason          text,
 *   status          text not null default 'pending',   -- 'pending' | 'approved' | 'rejected'
 *   reviewed_by     uuid references public.profiles(id),
 *   reviewed_at     timestamptz,
 *   created_at      timestamptz not null default now()
 * );
 * alter table public.target_increase_requests enable row level security;
 * -- Members may insert their own requests and read their own rows
 * create policy "members_insert" on public.target_increase_requests
 *   for insert with check (auth.uid() = member_id);
 * create policy "members_select" on public.target_increase_requests
 *   for select using (auth.uid() = member_id);
 * ─────────────────────────────────────────────────────────
 */
export async function requestTargetIncrease(
  requestedPlots: number,
  reason?: string,
): Promise<ActionResult> {
  if (!Number.isInteger(requestedPlots) || requestedPlots <= MAX_PLOTS) {
    return { success: false, error: `Requested plots must be greater than ${MAX_PLOTS}.` }
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'User not authenticated. Please log in via GLM App.' }
  }

  // Only members who have fully completed their current target may apply
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
      error: 'You can only apply for a target increase after fully completing payment for your current plots.',
    }
  }

  // Block duplicate pending requests
  const { data: existingRequests } = await supabase
    .from('target_increase_requests')
    .select('id, status')
    .eq('member_id', user.id)
    .eq('status', 'pending')

  if (existingRequests && existingRequests.length > 0) {
    return {
      success: false,
      error: 'You already have a pending target increase request. Please wait for admin review.',
    }
  }

  const { error: insertError } = await supabase
    .from('target_increase_requests')
    .insert({
      member_id: user.id,
      current_plots: profile.plots,
      requested_plots: requestedPlots,
      reason: reason?.trim() || null,
    })

  if (insertError) {
    console.error('[actions] requestTargetIncrease error:', insertError.message)
    return { success: false, error: insertError.message }
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

