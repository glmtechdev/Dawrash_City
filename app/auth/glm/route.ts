/**
 * GET /auth/glm?token=<glm_access_token>
 * ─────────────────────────────────────────────────────────────────
 * Entry point when a GLM member arrives from the Members app.
 *
 * The GLM and Dawrash apps are separate Supabase projects with
 * different JWT secrets, so we cannot verify the token locally.
 * Instead we call the GLM project's auth API to validate the token
 * and extract the user's identity — then create a Dawrash session.
 *
 * Flow:
 *  1. Read ?token from query string
 *  2. Call GLM Supabase getUser(token) to validate and get identity
 *  3. Use Dawrash service role to upsert profile (first visit only)
 *  4. Use generateLink to create a Dawrash magic-link session
 *  5. Redirect through Supabase verify → /auth/callback → /dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  // Read all env vars inside the handler — not at module level.
  // Module-level constants are evaluated at build time on Vercel,
  // so env vars added after the build aren't visible there.
  const GLM_URL     = "https://innidgegsjjeclvkskev.supabase.co"; // public, hardcoded
  const GLM_ANON    = process.env.MEMBERS_BRIDGE_ANON_KEY;
  const DAWRASH_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ── 1. Token must be present ───────────────────────────────────
  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  // ── 2. Validate token via GLM Supabase auth API ────────────────
  // We pass the token to GLM's getUser — if it's valid and not
  // expired, we get back the user's identity. No shared secret needed.
  if (!GLM_ANON) {
    console.error("[auth/glm] MEMBERS_BRIDGE_ANON_KEY is not set");
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  const glmClient = createClient(GLM_URL, GLM_ANON!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user: glmUser }, error: userError } = await glmClient.auth.getUser(token);

  if (userError || !glmUser?.email) {
    console.error("[auth/glm] GLM token validation failed:", userError?.message);
    return NextResponse.redirect(`${origin}/login?error=invalid_token`);
  }

  // ── 3. Extract identity ────────────────────────────────────────
  const email       = glmUser.email;
  const glmMemberId = glmUser.id;
  const meta        = glmUser.user_metadata ?? {};
  const fullName    = (meta.full_name as string) ?? email.split("@")[0];
  const parts       = fullName.trim().split(" ");
  const initials    = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();

  // ── 4. Upsert profile in Dawrash DB ───────────────────────────
  if (!SERVICE_KEY) {
    console.error("[auth/glm] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  const adminClient = createClient(DAWRASH_URL!, SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if returning member
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

  // ── 5. Generate a Dawrash magic-link and redirect ──────────────
  // generateLink creates a one-time Supabase verify URL that signs
  // the member into the Dawrash project without sending any email.
  const destination = isNewMember ? "/onboarding/plots" : "/dashboard";

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: { full_name: fullName, glm_member_id: glmMemberId },
    },
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[auth/glm] generateLink error:", linkError?.message);
    return NextResponse.redirect(`${origin}/login?error=session_failed`);
  }

  const actionLink = new URL(linkData.properties.action_link);
  actionLink.searchParams.set(
    "redirect_to",
    `${origin}/auth/callback?next=${encodeURIComponent(destination)}`
  );

  return NextResponse.redirect(actionLink.toString());
}
