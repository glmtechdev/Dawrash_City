/**
 * Members Bridge
 * ------------------------------------------------------------
 * Server-side helper that calls the GLM Members DB Supabase
 * Edge Function to verify whether an email belongs to a
 * registered member.
 *
 * The bridge endpoint returns:
 *   { allowed: true,  member_id: "...", full_name: "..." }
 *   { allowed: false }
 *
 * Environment variables required (set in Vercel + .env.local):
 *   MEMBERS_BRIDGE_URL      - full URL of the check-member function
 *   MEMBERS_BRIDGE_SECRET   - shared secret sent as x-members-bridge-secret
 *   MEMBERS_BRIDGE_ANON_KEY - GLM Supabase anon key (required by Supabase
 *                             gateway as Authorization: Bearer header)
 */

export type BridgeResult =
  | { allowed: true; member_id: string; full_name: string }
  | { allowed: false; error?: string }

/**
 * Check whether `email` is a registered GLM member.
 * Must only be called from server-side code (Server Actions, Route Handlers).
 */
export async function checkMemberBridge(email: string): Promise<BridgeResult> {
  const url = process.env.MEMBERS_BRIDGE_URL
  const secret = process.env.MEMBERS_BRIDGE_SECRET
  const anonKey = process.env.MEMBERS_BRIDGE_ANON_KEY

  if (!url || !secret || !anonKey) {
    console.error('[bridge] MEMBERS_BRIDGE_URL, MEMBERS_BRIDGE_SECRET, or MEMBERS_BRIDGE_ANON_KEY is not set')
    return { allowed: false, error: 'Bridge not configured' }
  }

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Supabase gateway requires this header on all edge function calls
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
        'x-members-bridge-secret': secret,
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
      // Don't cache - membership status can change
      cache: 'no-store',
    })
  } catch (err) {
    console.error('[bridge] Network error calling members bridge:', err)
    return { allowed: false, error: 'Bridge unreachable' }
  }

  if (!res.ok) {
    console.error('[bridge] Bridge returned HTTP', res.status)
    return { allowed: false, error: `Bridge error ${res.status}` }
  }

  const data = await res.json()
  return data as BridgeResult
}
