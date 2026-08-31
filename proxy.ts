import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // ── Dev bypass — no Supabase calls, no network needed ────────────
  // When DEV_FORCE_EMAIL is set in .env.local, grant unconditional
  // superadmin access so the /admin dashboard is accessible on localhost
  // without going through GLM SSO or any outbound network request.
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_FORCE_EMAIL?.trim()
  ) {
    return NextResponse.next()
  }

  // Build a response we can attach cookie mutations to
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // Verify the session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check the admin / superadmin flags on the profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_superadmin')
    .eq('id', user.id)
    .maybeSingle()

  if (!(profile?.is_admin || profile?.is_superadmin)) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
