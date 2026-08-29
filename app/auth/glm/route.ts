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

  // Derive public origin dynamically from request headers (x-forwarded-host / host)
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "dawrashcity.vercel.app";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const appOrigin = host.includes("localhost") ? origin : `${proto}://${host}`;

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

  // ── 5. Upsert profile in Dawrash DB ───────────────────────────
  const adminClient = createClient(DAWRASH_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await adminClient
    .from("profiles")
    .select("id, onboarding_complete")
    .eq("glm_member_id", glmMemberId)
    .maybeSingle();

  const isNewMember = !existing?.onboarding_complete;

  if (!existing) {
    const { error: insertError } = await adminClient.from("profiles").insert({
      glm_member_id: glmMemberId,
      full_name: fullName,
      email,
      initials,
    });
    if (insertError && !insertError.message.includes("duplicate")) {
      console.error("[auth/glm] profile insert error:", insertError.message);
    }
  }

  // ── 6. Generate a Dawrash magic-link and redirect ──────────────
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

  const actionLink = new URL(linkData.properties.action_link);
  actionLink.searchParams.set("redirect_to", callbackUrl);

  return NextResponse.redirect(actionLink.toString());
}

