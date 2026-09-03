import { redirect } from 'next/navigation'

/**
 * Plot selection has been removed.
 * Every member is automatically assigned 1 personal plot on first login.
 * Redirect any visit to this route straight to the covenant signing step.
 */
export default function PlotSelectionPage() {
  redirect('/onboarding/covenant')
}
