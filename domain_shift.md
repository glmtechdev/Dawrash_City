# Domain Shift & Production Configuration Guide

This document contains the complete reference and configuration steps for the custom domain transition across the **Dawrash City** and **GLM Members** platforms.

---

## 1. Domain Mapping Summary

| Platform | Old Domain | New Custom Domain |
| :--- | :--- | :--- |
| **Dawrash City Web App** | `https://dawrashcity.vercel.app` | **`https://dawrashcity.com`** (and `https://www.dawrashcity.com`) |
| **GLM Central Members App** | `https://members-dbase.vercel.app` | **`https://members.glmhq.org`** |

---

## 2. Configuration Action Checklist

### A. Vercel Hosting Configuration (Dawrash City)

1. **Add Custom Domain**:
   - Go to **Vercel Dashboard** → Select **Dawrash City** project → **Settings** → **Domains**.
   - Add `dawrashcity.com` and `www.dawrashcity.com`.
   - Configure your DNS provider (e.g. Namecheap, GoDaddy, Cloudflare):
     - **A Record**: `@` → `76.76.21.21`
     - **CNAME Record**: `www` → `cname.vercel-dns.com`

2. **Update Environment Variables**:
   - In **Vercel** → **Settings** → **Environment Variables**:
     - `NEXT_PUBLIC_SITE_URL` = `https://dawrashcity.com` (Environment: **Production**)
   - **Redeploy** the latest deployment so the new site URL is active.

---

### B. Paystack Dashboard (Payment Gateway)

1. Log in to [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer).
2. Navigate to **Settings** → **API Keys & Webhooks**:
   - **Live Webhook URL**:
     ```text
     https://dawrashcity.com/api/paystack/webhook
     ```
   - **Live Callback URL**:
     ```text
     https://dawrashcity.com/transactions
     ```
3. Click **Save Changes**.

> [!IMPORTANT]
> The automated Paystack payment processing relies on the Webhook URL above. Ensure there are no typos.

---

### C. Supabase Authentication (Dawrash City Project: `fzigfgczvaknocznhmsc`)

1. Open your **Supabase Dashboard** for Dawrash City (`fzigfgczvaknocznhmsc`).
2. Go to **Authentication** → **URL Configuration**.
3. Set **Site URL**:
   ```text
   https://dawrashcity.com
   ```
4. In **Redirect URLs**, add the following entries:
   ```text
   https://dawrashcity.com/**
   https://dawrashcity.com/auth/callback
   https://dawrashcity.com/auth/glm
   https://dawrashcity.com/dashboard
   https://dawrashcity.com/admin
   http://localhost:3000/**
   ```
5. Click **Save**.

---

### D. GLM Members Portal Integration (`members.glmhq.org`)

In the church's central GLM application repository/portal:
1. Update the **"Open Dawrash City"** launcher button target to point to:
   ```text
   https://dawrashcity.com/auth/glm?token=<glm_user_access_token>
   ```
2. In the GLM Supabase Auth settings (`innidgegsjjeclvkskev`), ensure `https://dawrashcity.com` is listed under allowed web origins if needed for cross-domain API calls.

---

## 3. Codebase Changes Made in this Repository

- **[`app/login/page.tsx`](file:///home/tizzleshop-dev/Documents/Github-Projects/Dawrash-City/app/login/page.tsx)**: Updated the "Open GLM Members App" external link from `members-dbase.vercel.app` to `https://members.glmhq.org`.
- **[`app/register/page.tsx`](file:///home/tizzleshop-dev/Documents/Github-Projects/Dawrash-City/app/register/page.tsx)**: Updated the "Open GLM Members App" external link from `members-dbase.vercel.app` to `https://members.glmhq.org`.
- **[`proxy.ts`](file:///home/tizzleshop-dev/Documents/Github-Projects/Dawrash-City/proxy.ts)** & **Auth Routes**: Dynamically consume `NEXT_PUBLIC_SITE_URL` (resolving to `https://dawrashcity.com`).
