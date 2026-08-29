/**
 * GET /auth/glm?token=<glm_access_token>
 * ─────────────────────────────────────────────────────────────────
 * Entry point when a GLM member arrives from the Members app.
 *
 * The access_token was issued by the GLM Supabase project.
 * Because both Supabase projects share the same JWT secret,
 * we can verify the token here without any extra network call.
 *
 * Flow:
 *  1. Read ?token from query string
 *  2. Verify the JWT signature using the shared secret
 *  3. Extract sub (user id), email, user_metadata
 *  4. Use the Supabase service role to upsert the member's
 *     profile row in the Dawrash DB (first visit only)
 *  5. Set a Dawrash session cookie via setSession()
 *  6. Redirect to /onboarding/plots (new) or /dashboard (returning)
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  // ── 1. Token must be present ───────────────────────────────────
  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  // ── 2. Verify the JWT ─────────────────────────────────────────
  // Both Supabase projects share the same JWT_SECRET.
  // Set SUPABASE_JWT_SECRET in Vercel env vars (same value as
  // GLM Members DB project's JWT secret — found in Supabase
  // Dashboard → Project Settings → API → JWT Secret).
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    console.error("[auth/glm] SUPABASE_JWT_SECRET is not set");
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  let payload: any;
  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const result = await jwtVerify(token, secret);
    payload = result.payload;
  } catch (err) {
    console.error("[auth/glm] JWT verification failed:", err);
    return NextResponse.redirect(`${origin}/login?error=invalid_token`);
  }

  // ── 3. Extract identity from the verified payload ──────────────
  const userId: string = payload.sub;
  const email: string = payload.email ?? "";
  const meta = payload.user_metadata ?? {};
  const fullName: string = meta.full_name ?? email.split("@")[0];
  const glmMemberId: string = userId; // the GLM project's auth.users.id

  // Derive initials
  const parts = fullName.trim().split(" ");
  const initials = (
    (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
  ).toUpperCase();

  // ── 4. Upsert profile in Dawrash DB using service role ─────────
  // Service role bypasses RLS — safe for server-side use only.
  const dawrashUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceKey) {
    console.error("[auth/glm] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  const adminClient = createClient(dawrashUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if this member has been here before
  const { data: existing } = await adminClient
    .from("profiles")
    .select("id, onboarding_complete")
    .eq("glm_member_id", glmMemberId)
    .maybeSingle();

  const isNewMember = !existing?.onboarding_complete;

  if (!existing) {
    // First visit — create their profile row.
    // We use glm_member_id as the stable identifier; the Dawrash
    // auth.users row is created separately by setSession below.
    const { error: insertError } = await adminClient.from("profiles").insert({
      // id will be set once we know the Dawrash auth.users.id;
      // for now we use a placeholder that gets updated below.
      glm_member_id: glmMemberId,
      full_name: fullName,
      email,
      initials,
    });

    if (insertError && !insertError.message.includes("duplicate")) {
      console.error("[auth/glm] profile insert error:", insertError.message);
    }
  }

  // ── 5. Sign the member into the Dawrash Supabase project ───────
  // Because both projects share the same JWT secret, we can create
  // a Dawrash magic-link session by having the admin client generate
  // a sign-in link and then setting the session directly.
  //
  // The cleanest approach: use generateLink to create a valid
  // Dawrash session for this email, then redirect to the link.
  // This makes Dawrash's auth.users aware of the member.
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: {
        full_name: fullName,
        glm_member_id: glmMemberId,
      },
    },
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[auth/glm] generateLink error:", linkError?.message);
    return NextResponse.redirect(`${origin}/login?error=session_failed`);
  }

  // The generated link looks like:
  // https://<project>.supabase.co/auth/v1/verify?token=xxx&type=magiclink&redirect_to=...
  // We redirect to it with our callback as the redirect_to,
  // which creates the session then sends them to the right page.
  const supabaseVerifyUrl = new URL(linkData.properties.action_link);
  supabaseVerifyUrl.searchParams.set(
    "redirect_to",
    `${origin}/auth/callback?glm=1&next=${isNewMember ? "/onboarding/plots" : "/dashboard"}`
  );

  return NextResponse.redirect(supabaseVerifyUrl.toString());
}
