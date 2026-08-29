import { NextResponse } from 'next/server'

export async function GET() {
  const required = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'MEMBERS_BRIDGE_ANON_KEY',
  ]

  const missing = required.filter((k) => !process.env[k])

  return NextResponse.json({ ok: missing.length === 0, missing })
}
