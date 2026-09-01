/**
 * GET /auth/dev?email=<your@email.com>&next=/admin
 * ─────────────────────────────────────────────────────────────────
 * LOCAL DEVELOPMENT ONLY - returns 404 in production.
 *
 * Sends a Supabase magic link OTP email using the CLIENT-SIDE anon key
 * (no admin API, no server-side network calls), then shows a page where
 * the user enters the 6-digit OTP from their email to complete sign-in.
 *
 * This avoids the admin generateLink → verifyOtp flow entirely so it
 * works even when the dev machine has restricted outbound DNS/network.
 *
 * Usage: Use the "Dev Login" form on /login - it submits here.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { searchParams, origin } = new URL(request.url)
  const email = searchParams.get('email')?.trim().toLowerCase()
  const next  = searchParams.get('next') ?? '/dashboard'

  if (!email) {
    return new NextResponse(renderHtml('', 'Email is required.', next), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const DAWRASH_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const DAWRASH_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // ── Trigger a magic link / OTP email via the anon client ──────
  // This call goes out to Supabase, but if it fails we show a
  // manual-token fallback page so the user can still sign in.
  let otpSent = false
  try {
    const supabase = createClient(DAWRASH_URL, DAWRASH_ANON, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await supabase.auth.signInWithOtp({ email })
    otpSent = !error
    if (error) console.warn('[auth/dev] signInWithOtp warning:', error.message)
  } catch (err: any) {
    console.warn('[auth/dev] signInWithOtp network error (non-fatal):', err.message)
  }

  // ── Return a simple HTML page with a token-entry form ─────────
  return new NextResponse(renderHtml(email, '', next, otpSent), {
    headers: { 'Content-Type': 'text/html' },
  })
}

// ── POST: receive the 6-digit OTP and exchange for session ────────
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const formData = await request.formData()
    const email    = (formData.get('email') as string)?.trim().toLowerCase()
    const token    = (formData.get('token') as string)?.trim()
    const next     = (formData.get('next') as string) ?? '/dashboard'

    if (!email || !token) {
      return new NextResponse(renderHtml(email ?? '', 'Email and OTP token are required.', next), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    const DAWRASH_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const DAWRASH_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Verify the OTP - this exchanges it for a session
    const supabase = createClient(DAWRASH_URL, DAWRASH_ANON, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

    if (error || !data.session) {
      return new NextResponse(
        renderHtml(email, `OTP error: ${error?.message ?? 'no session returned'}`, next, true),
        { headers: { 'Content-Type': 'text/html' } },
      )
    }

    // ── Write the session tokens as cookies ───────────────────────
    // Supabase SSR expects these specific cookie names.
    const { access_token, refresh_token } = data.session
    const projectRef = new URL(DAWRASH_URL).hostname.split('.')[0]

    const cookieOpts = 'Path=/; HttpOnly; SameSite=Lax'
    const maxAge     = `Max-Age=${data.session.expires_in ?? 3600}`

    const response = NextResponse.redirect(`${new URL(request.url).origin}${next}`)
    response.headers.append('Set-Cookie', `sb-${projectRef}-auth-token=${JSON.stringify([access_token, refresh_token])}; ${cookieOpts}; ${maxAge}`)
    response.headers.append('Set-Cookie', `sb-${projectRef}-auth-token.0=${access_token}; ${cookieOpts}; ${maxAge}`)
    response.headers.append('Set-Cookie', `sb-${projectRef}-auth-token.1=${refresh_token}; ${cookieOpts}; ${maxAge}`)

    return response

  } catch (err: any) {
    const msg = err?.cause?.message ?? err?.message ?? String(err)
    return new NextResponse(renderHtml('', `Server error: ${msg}`, '/dashboard'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

// ── Minimal HTML UI ────────────────────────────────────────────────
function renderHtml(email: string, error: string, next: string, otpSent = false) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dev Login - Dawrash City</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a1017; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; }
    .card { background: #111827; border: 1px solid #f59e0b44; border-radius: 1rem; padding: 2rem; width: 100%; max-width: 400px; }
    h1 { font-size: 1.25rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.25rem; }
    p.sub { font-size: 0.8rem; color: #94a3b8; margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.35rem; }
    input { width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; color: #e2e8f0; font-size: 0.875rem; padding: 0.6rem 0.75rem; margin-bottom: 1rem; }
    input:focus { outline: none; border-color: #f59e0b; }
    button { width: 100%; background: #f59e0b; color: #1c1404; font-weight: 700; font-size: 0.875rem; padding: 0.65rem; border: none; border-radius: 0.5rem; cursor: pointer; }
    button:hover { background: #fbbf24; }
    .error { background: #7f1d1d44; border: 1px solid #f87171; border-radius: 0.5rem; color: #f87171; font-size: 0.8rem; padding: 0.6rem 0.75rem; margin-bottom: 1rem; }
    .success { background: #14532d44; border: 1px solid #4ade80; border-radius: 0.5rem; color: #4ade80; font-size: 0.8rem; padding: 0.6rem 0.75rem; margin-bottom: 1rem; }
    .divider { border: none; border-top: 1px solid #1e293b; margin: 1.25rem 0; }
    a { color: #f59e0b; font-size: 0.78rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚡ Dev Login</h1>
    <p class="sub">Localhost bypass - not available in production</p>

    ${error ? `<div class="error">${error}</div>` : ''}
    ${otpSent ? `<div class="success">✅ Magic link / OTP sent to <strong>${email}</strong> - check your inbox and enter the 6-digit code below.</div>` : ''}

    ${!otpSent ? `
    <form action="/auth/dev" method="get">
      <input type="hidden" name="next" value="${next}" />
      <label>Your admin email</label>
      <input type="email" name="email" value="${email}" placeholder="you@example.com" required autofocus />
      <button type="submit">Send OTP →</button>
    </form>
    ` : `
    <form action="/auth/dev" method="post">
      <input type="hidden" name="email" value="${email}" />
      <input type="hidden" name="next" value="${next}" />
      <label>6-digit OTP from your email</label>
      <input type="text" name="token" placeholder="123456" maxlength="6" pattern="[0-9]{6}" inputmode="numeric" required autofocus />
      <button type="submit">Sign in →</button>
    </form>
    <hr class="divider" />
    <a href="/auth/dev?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}">↩ Resend OTP</a>
    `}
  </div>
</body>
</html>`
}
