/**
 * GET /auth/glm?token=<glm_access_token>
 * ─────────────────────────────────────────────────────────────────
 * SSO entry point - called when a GLM member clicks "Open Dawrash City".
 *
 * The GLM and Dawrash apps are separate Supabase projects with different
 * JWT secrets, so we validate the token by calling GLM's auth API directly.
 *
 * Flow:
 *  1. Read ?token from query string
 *  2. Call GLM Supabase getUser(token) to validate identity
 *  3. Ensure user exists in Dawrash auth.users (create on first visit)
 *  4. Upsert member profile in the Dawrash DB
 *  5. Generate a magic-link via admin API to get a hashed_token
 *  6. Exchange hashed_token for a real session via verifyOtp (server-side,
 *     no browser redirect through Supabase verify endpoint)
 *  7. Write session cookies via @supabase/ssr
 *  8. Redirect to /onboarding/plots (new member) or /dashboard (returning)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { decodeJwt } from "jose";

// Force this route to always run dynamically - never cache the redirect
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  // Determine application public origin
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";

  const appOrigin = (envSiteUrl && !envSiteUrl.includes("localhost"))
    ? envSiteUrl
    : (host && !host.includes("localhost") ? `${proto}://${host}` : origin);

  // ── Env vars ──────────────────────────────────────────────────
  const GLM_URL  = "https://innidgegsjjeclvkskev.supabase.co";
  const GLM_ANON = process.env.MEMBERS_BRIDGE_ANON_KEY
    ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlubmlkZ2Vnc2pqZWNsdmtza2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2OTM2NDksImV4cCI6MjA5MDI2OTY0OX0.aidDrhnobEDvyWnCyUP5AhH9gxfoKHXt4nsytKpCywQ";

  const DAWRASH_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://fzigfgczvaknocznhmsc.supabase.co";
  const DAWRASH_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  // ── 1. Token must be present ──────────────────────────────────
  if (!token) {
    return NextResponse.redirect(`${appOrigin}/login?error=missing_token`);
  }

  // ── 2. Service key and anon key must be configured ────────────
  if (!SERVICE_KEY || !DAWRASH_ANON) {
    console.error("[auth/glm] Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return NextResponse.redirect(`${appOrigin}/login?error=config_svc`);
  }

  // ── 3. Validate token via GLM Supabase (with JWT payload fallback) ──
  let email: string | null = null;
  let glmMemberId: string | null = null;
  let fullName: string = "";

  const glmClient = createClient(GLM_URL, GLM_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user: glmUser }, error: userError } = await glmClient.auth.getUser(token);

  if (glmUser?.email) {
    email = glmUser.email;
    glmMemberId = glmUser.id;
    const meta = glmUser.user_metadata ?? {};
    fullName = (meta.full_name as string) ?? email.split("@")[0];
  } else {
    console.warn("[auth/glm] GLM getUser note:", userError?.message, "- attempting JWT decode fallback");
    try {
      const payload = decodeJwt(token);
      if (payload && typeof payload.email === "string") {
        email = payload.email;
        const meta = (payload.user_metadata as Record<string, any>) ?? {};
        glmMemberId = (payload.sub as string) ?? (meta.glm_member_id as string) ?? null;
        fullName = (meta.full_name as string) ?? email.split("@")[0];
      }
    } catch (jwtErr: any) {
      console.error("[auth/glm] JWT payload decode failed:", jwtErr?.message);
    }
  }

  if (!email) {
    console.error("[auth/glm] Could not extract valid member email from token");
    return NextResponse.redirect(`${appOrigin}/login?error=invalid_token`);
  }

  // ── 4. Extract identity ───────────────────────────────────────
  const parts    = fullName.trim().split(" ");
  const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "MB";

  // ── 5. Ensure user exists in Dawrash auth.users ──────────────
  const adminClient = createClient(DAWRASH_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create on first visit; ignore "already exists" errors
  const { data: createData } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, glm_member_id: glmMemberId },
  });

  let dawrashUserId = createData?.user?.id;

  // If user already existed, resolve their ID by listing users
  if (!dawrashUserId) {
    const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    dawrashUserId = listData?.users?.find((u) => u.email === email)?.id;
  }

  if (!dawrashUserId) {
    console.error("[auth/glm] Could not resolve Dawrash user ID for:", email);
    return NextResponse.redirect(`${appOrigin}/login?error=user_not_found`);
  }

  // ── 6. Check existing profile in Dawrash DB ──────────────────
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id, onboarding_complete")
    .or(`glm_member_id.eq.${glmMemberId},email.eq.${email}`)
    .maybeSingle();

  const isNewMember = !existingProfile?.onboarding_complete;

  // ── 7. Upsert profile ─────────────────────────────────────────
  // Remove orphaned rows (profile ID no longer matches auth.users ID)
  if (existingProfile && existingProfile.id !== dawrashUserId) {
    await adminClient.from("profiles").delete().eq("id", existingProfile.id);
  }

  await adminClient.from("profiles").upsert(
    {
      id: dawrashUserId,
      glm_member_id: glmMemberId,
      full_name: fullName,
      email,
      initials,
      onboarding_complete: existingProfile?.onboarding_complete ?? false,
    },
    { onConflict: "id" }
  );

  // ── 8. Generate magic-link and exchange hashed_token server-side ──
  //
  // Instead of redirecting the browser through Supabase's /auth/v1/verify
  // endpoint (which triggers an implicit-flow hash response), we:
  //   a) Generate the link to get the hashed_token
  //   b) Call verifyOtp({ token_hash, type: "magiclink" }) directly here on
  //      the server - this returns a full session without any browser hop
  //   c) Write the session into SSR cookies and redirect straight to the app
  //
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: { full_name: fullName, glm_member_id: glmMemberId },
    },
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[auth/glm] generateLink error:", linkError?.message);
    return NextResponse.redirect(`${appOrigin}/login?error=session_failed`);
  }

  // Build the response redirect early so we can write cookies onto it
  const destination = isNewMember ? "/onboarding/plots" : "/dashboard";
  const response = NextResponse.redirect(`${appOrigin}${destination}`);

  // Create an SSR client that writes cookies directly onto the response
  const ssrClient = createServerClient(DAWRASH_URL, DAWRASH_ANON, {
    cookies: {
      getAll: () => [],
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Exchange the hashed_token for a real session - fully server-side,
  // no browser redirect through Supabase /auth/v1/verify needed
  const { error: otpError } = await ssrClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  if (otpError) {
    console.error("[auth/glm] verifyOtp error:", otpError.message);
    return NextResponse.redirect(`${appOrigin}/login?error=session_failed`);
  }

  // Session cookies are now set on `response` - return the redirect
  return response;
}
