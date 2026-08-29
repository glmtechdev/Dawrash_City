/**
 * GET /auth/glm?token=<glm_access_token>
 * ─────────────────────────────────────────────────────────────────
 * SSO entry point — called when a GLM member clicks "Open Dawrash City".
 *
 * The GLM and Dawrash apps are separate Supabase projects with different
 * JWT secrets, so we validate the token by calling GLM's auth API directly.
 *
 * Flow:
 *  1. Read ?token from query string
 *  2. Call GLM Supabase getUser(token) to validate identity
 *  3. Upsert member profile in the Dawrash DB (first visit only)
 *  4. Generate a Dawrash magic-link (no email sent — server-side only)
 *  5. Redirect through Supabase verify → /auth/callback → /dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force this route to always run dynamically — never cache the redirect
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  // Determine application public origin: prioritize configured NEXT_PUBLIC_SITE_URL in prod, fallback to request headers
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";

  const appOrigin = (envSiteUrl && !envSiteUrl.includes("localhost"))
    ? envSiteUrl
    : (host && !host.includes("localhost") ? `${proto}://${host}` : origin);

  // ── All env vars read inside the handler (not module-level) ───
  const GLM_URL  = "https://innidgegsjjeclvkskev.supabase.co";
  const GLM_ANON = process.env.MEMBERS_BRIDGE_ANON_KEY
    ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlubmlkZ2Vnc2pqZWNsdmtza2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2OTM2NDksImV4cCI6MjA5MDI2OTY0OX0.aidDrhnobEDvyWnCyUP5AhH9gxfoKHXt4nsytKpCywQ";

  const DAWRASH_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://fzigfgczvaknocznhmsc.supabase.co";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  // ── 1. Token must be present ───────────────────────────────────
  if (!token) {
    return NextResponse.redirect(`${appOrigin}/login?error=missing_token`);
  }

  // ── 2. Dawrash service key must be configured ──────────────────
  if (!SERVICE_KEY) {
    console.error("[auth/glm] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.redirect(`${appOrigin}/login?error=config_svc`);
  }

  // ── 3. Validate token via GLM Supabase ─────────────────────────
  const glmClient = createClient(GLM_URL, GLM_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user: glmUser }, error: userError } = await glmClient.auth.getUser(token);

  if (userError || !glmUser?.email) {
    console.error("[auth/glm] GLM token validation failed:", userError?.message);
    return NextResponse.redirect(`${appOrigin}/login?error=invalid_token`);
  }

  // ── 4. Extract identity ────────────────────────────────────────
  const email       = glmUser.email;
  const glmMemberId = glmUser.id;
  const meta        = glmUser.user_metadata ?? {};
  const fullName    = (meta.full_name as string) ?? email.split("@")[0];
  const parts       = fullName.trim().split(" ");
  const initials    = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();

  // ── 5. Ensure user exists in Dawrash auth.users ─────────────
  const adminClient = createClient(DAWRASH_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Attempt to create the user in Dawrash auth.users if first visit
  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, glm_member_id: glmMemberId },
  });

  let dawrashUserId = createData?.user?.id;

  if (!dawrashUserId && createError) {
    console.log("[auth/glm] User already registered or creation notice:", createError.message);
  }

  // ── 6. Check existing profile in Dawrash DB ──────────────────
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id, onboarding_complete")
    .or(`glm_member_id.eq.${glmMemberId},email.eq.${email}`)
    .maybeSingle();

  const isNewMember = !existingProfile?.onboarding_complete;

  // ── 7. Generate magic-link for Dawrash project ────────────────
  const destination = isNewMember ? "/onboarding/plots" : "/dashboard";
  const callbackUrl = `${appOrigin}/auth/callback?next=${encodeURIComponent(destination)}`;

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: callbackUrl,
      data: { full_name: fullName, glm_member_id: glmMemberId },
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error("[auth/glm] generateLink error:", linkError?.message);
    return NextResponse.redirect(`${appOrigin}/login?error=session_failed`);
  }

  // Determine target auth.users id
  const targetUserId = dawrashUserId || linkData.user?.id;

  // ── 8. Upsert profile in Dawrash DB linked to auth.users.id ─────
  if (targetUserId) {
    // If an old profile row exists with a different ID (from before the fix), remove the orphaned row first
    if (existingProfile && existingProfile.id !== targetUserId) {
      await adminClient.from("profiles").delete().eq("id", existingProfile.id);
    }

    const { error: profileInsertError } = await adminClient.from("profiles").upsert(
      {
        id: targetUserId,
        glm_member_id: glmMemberId,
        full_name: fullName,
        email,
        initials,
        onboarding_complete: existingProfile?.onboarding_complete ?? false,
      },
      { onConflict: "id" }
    );

    if (profileInsertError) {
      console.error("[auth/glm] profile upsert error:", profileInsertError.message);
    }
  }

  // ── 9. Redirect browser through Supabase verify → /auth/callback ───
  const actionLink = new URL(linkData.properties.action_link);
  actionLink.searchParams.set("redirect_to", callbackUrl);

  return NextResponse.redirect(actionLink.toString());
}

