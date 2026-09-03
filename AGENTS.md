# AGENTS.md - Dawrash City

This file gives AI coding agents and contributors a precise map of how the codebase is structured and how the business logic works. Read this before making any changes.

---

## Project Summary

Dawrash City is a Next.js 15 (App Router) land savings platform for Gospel Labour Ministry (GLM) church members. Members save toward personal land plots in the Dawrash City development. Every member is automatically assigned 1 personal plot on first login. A member who wants a second plot must apply through the "Apply for More" form after fully paying for their first.

The app is accessed exclusively via SSO from the GLM Members app. There is no standalone login.

---

## Key Business Rules

1. **Every new member gets 1 plot automatically.** `plots = 1` is written to `profiles` during the first `/auth/glm` SSO visit. Members never choose their initial plot count.

2. **Target = plots x N2,000,000.** Each personal plot is paired with one church-building plot, both funded by the member. 1 personal plot = N2,000,000 total. 2 personal plots = N4,000,000 total.

3. **The maximum personal plot count is 2.** There is no self-service way to go beyond 1. The only path to 2 is to complete payment for the first plot, then submit an "Apply for More" application and get it approved by admin.

4. **"Apply for More" eligibility:** `profiles.status === 'completed'` (total confirmed kobo >= plots x 200_000_000) AND no existing pending application in `target_increase_requests`.

5. **Onboarding is one step only.** The `/onboarding/plots` page no longer exists. New members land on `/onboarding/covenant`, sign the covenant, and go to `/dashboard`. Plot selection has been removed.

6. **Status lifecycle:** `pending_covenant` -> `active` (on covenant sign) -> `completed` (when confirmed payments reach the target). The Paystack webhook handles the `active -> completed` transition automatically.

7. **Church plots are not assigned to members.** The `profiles.plots` column tracks personal plots only. Church plots (always equal in number to personal plots) are tracked as a derived count in the admin dashboard and go to the GLM church building project.

---

## Codebase Map

### Auth & Entry
| File | Purpose |
|---|---|
| `app/auth/glm/route.ts` | SSO entry point. Validates GLM JWT, creates/upserts profile with `plots = 1` for new members, generates session, redirects to `/onboarding/covenant` (new) or `/dashboard` (returning). |
| `app/auth/callback/route.ts` | Handles magic-link redirect from Supabase (not the primary flow; used as fallback). |

### Onboarding
| File | Purpose |
|---|---|
| `app/onboarding/covenant/page.tsx` | The only onboarding step. Member reads and accepts the Dawrash Covenant. Calls `acceptCovenant()`. |
| `app/onboarding/plots/page.tsx` | Deprecated. This page should redirect to `/onboarding/covenant`. Do not add new logic here. |

### Member Actions (Server Actions)
| File | Purpose |
|---|---|
| `app/actions.ts` | All member-facing server actions. `savePlotSelection` and `updateTarget` are now removed/unused. `acceptCovenant` and `submitPlotApplication` are the active member actions. |

### Member Pages
| File | Purpose |
|---|---|
| `app/dashboard/page.tsx` | Main member dashboard. Shows savings ring, quick stats, recent payments. |
| `app/profile/page.tsx` | Member profile. Shows plot badge, savings snapshot, covenant, and "Apply for More" button (for eligible members). |
| `app/transactions/page.tsx` | Full transaction history and Paystack checkout. |

### Admin
| File | Purpose |
|---|---|
| `app/admin/page.tsx` | Server-side admin guard. Redirects non-admins. Passes data to `AdminClient`. |
| `app/admin/admin-client.tsx` | Client shell for the admin panel. Owns tab state. |
| `app/admin/actions.ts` | All admin server actions. Key actions: `fetchAdminDashboardData`, `recordManualTransactionAction`, `approveApplicationAction`, `rejectApplicationAction`. |
| `components/dawrash/admin-sections.tsx` | All 6 admin tab section components: Overview, Members, Transactions, Applications, Certificates, Audit. |

### Components
| File | Purpose |
|---|---|
| `components/dawrash/apply-for-more-dialog.tsx` | The 6-field "Apply for More" form dialog shown on the Profile page. |
| `components/dawrash/member-layout.tsx` | Shell layout for all authenticated member pages. |
| `components/dawrash/bottom-nav.tsx` | Mobile bottom nav bar. |
| `components/dawrash/member-nav.tsx` | Desktop top/side nav. |
| `components/dawrash/progress-ring.tsx` | Circular SVG progress indicator used on dashboard and admin. |
| `components/dawrash/status-badge.tsx` | Member status chip (Active, Completed, Pending Covenant). |
| `components/dawrash/transactions-content.tsx` | Paystack inline checkout UI and transaction listing. |

### Data & Constants
| File | Purpose |
|---|---|
| `lib/dawrash-data.ts` | All financial constants and calculation helpers. See key values below. |
| `lib/member-data.ts` | `getCurrentMemberServer()` - fetches the signed-in member's profile and transactions from Supabase. Used on all member pages. |

### Payments
| File | Purpose |
|---|---|
| `app/api/paystack/initiate/route.ts` | Calls Paystack API to initialize a transaction. Embeds `member_id` and `intended_amount_kobo` in metadata. |
| `app/api/paystack/webhook/route.ts` | Receives Paystack `charge.success` events. Upserts transaction, runs auto-completion check. |

---

## Key Constants (`lib/dawrash-data.ts`)

```
PRICE_PER_PLOT_KOBO            = 1_000_000 * 100   // N1,000,000 per plot
CHURCH_PLOT_MULTIPLIER         = 2                  // 1 personal + 1 church funded by member
PAYMENT_PER_PERSONAL_PLOT_KOBO = 2_000_000 * 100   // N2,000,000 per personal plot selected
MAX_PLOTS                      = 2                  // maximum personal plots per member
```

`targetKobo(member)` = `member.plots * PAYMENT_PER_PERSONAL_PLOT_KOBO`

---

## Database Tables (Supabase: `fzigfgczvaknocznhmsc`)

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | `id`, `plots` (1 or 2), `status`, `onboarding_complete`, `covenant_signed_at`, `is_admin`, `is_superadmin` | `plots` defaults to 0; set to 1 by SSO handler on first visit |
| `transactions` | `member_id`, `amount_kobo`, `status` (pending/confirmed/failed), `reference` | Paystack webhook upserts here |
| `audit_flags` | `member_id`, `reference`, `expected_kobo`, `recorded_kobo`, `resolved` | Created manually by superadmin |
| `certificates` | `member_id`, `plot_numbers`, `issued_at`, `delivered` | Issued by admin after `status = completed` |
| `target_increase_requests` | `member_id`, `current_plots`, `requested_plots`, `full_name`, `phone_number`, `pastor_name`, `auxano_center`, `residential_address`, `occupation`, `status` (pending/approved/rejected), `reviewed_by`, `reviewed_at` | "Apply for More" applications |

### SQL for `target_increase_requests` (run once in Supabase SQL editor)

```sql
-- Add new application fields to target_increase_requests
-- (Run this if the table already exists from a prior version)
alter table public.target_increase_requests
  add column if not exists full_name          text,
  add column if not exists phone_number       text,
  add column if not exists pastor_name        text,
  add column if not exists auxano_center      text,
  add column if not exists residential_address text,
  add column if not exists occupation         text;

-- Drop the old 'reason' column if it exists and is no longer needed
-- Only run this after confirming no data depends on it
-- alter table public.target_increase_requests drop column if exists reason;
```

If the table does not exist yet, create it from scratch:

```sql
create table if not exists public.target_increase_requests (
  id                   uuid        primary key default gen_random_uuid(),
  member_id            uuid        not null references public.profiles(id) on delete cascade,
  current_plots        int         not null,
  requested_plots      int         not null,
  full_name            text,
  phone_number         text,
  pastor_name          text,
  auxano_center        text,
  residential_address  text,
  occupation           text,
  status               text        not null default 'pending',
  reviewed_by          uuid        references public.profiles(id),
  reviewed_at          timestamptz,
  created_at           timestamptz not null default now()
);

alter table public.target_increase_requests enable row level security;

-- Members may insert their own requests
create policy "members_insert" on public.target_increase_requests
  for insert with check (auth.uid() = member_id);

-- Members may read their own requests
create policy "members_select" on public.target_increase_requests
  for select using (auth.uid() = member_id);
```

---

## What Changed in Version 3.0 (September 2026)

| Old behaviour | New behaviour |
|---|---|
| Member selects 1-5 plots during onboarding | Every member is auto-assigned 1 plot on first SSO login |
| Onboarding = 2 steps (plot selection + covenant) | Onboarding = 1 step (covenant only) |
| MAX_PLOTS = 5 | MAX_PLOTS = 2 |
| Members can update their target self-service (1-5 plots) | No self-service target changes; plot count is fixed at 1 |
| Target increase requires completing 5 plots, then applying for more | Second plot requires completing 1 plot (N2,000,000), then applying |
| `target_increase_requests.reason` was the only extra field | Application now collects full_name, phone_number, pastor_name, auxano_center, residential_address, occupation |
| Admin could cap plots to 5 via a maintenance button | No cap button needed; max is 2 and is enforced in code |
| `/onboarding/plots` was an active route | Deprecated; redirects to `/onboarding/covenant` |
| Profile page had "Update Target" dialog | Removed; replaced by "Apply for More" for eligible completed members |
| Landing page: "No Plot Limit" | Landing page: "1 Plot allocated to every member" |

---

## Agent Rules

- Do not add a plot selection step or slider anywhere in the member-facing UI. Plot count is set server-side.
- Do not raise MAX_PLOTS above 2 without explicit instruction.
- Do not show the "Apply for More" button to members who are `active` (still saving). Only show it to `completed` members with no pending application.
- When approving an application, set `profiles.plots = 2`. Do not set it to any other value.
- All monetary amounts must be stored as kobo integers. Display as naira with the N sign and commas.
- Do not use em dashes in any UI copy. See PRD section 20 for the full copy rules.
- Do not use `updateTarget` or `savePlotSelection` server actions in new code. They are deprecated.
- The `/onboarding/plots` route must redirect immediately to `/onboarding/covenant`. Do not render any UI there.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
