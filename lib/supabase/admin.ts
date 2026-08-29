/**
 * Supabase admin client using the service-role key.
 * Bypasses Row Level Security — only use in server actions and route handlers,
 * never in client components or anywhere the key could leak to the browser.
 */
import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      '[supabase/admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
