# Dawrash City - Product Requirements Document

**Version:** 1.1  
**Last updated:** August 2026  
**Status:** Active Development  
**Owner:** Gospel Labour Ministry (GLM)

---

## 1. Overview

Dawrash City is a faith-based land savings platform built exclusively for registered members of Gospel Labour Ministry (GLM). It enables members to reserve plots of land within the Dawrash City development project, track their savings progress, and receive land certificates upon full payment.

The platform is accessed exclusively through the GLM Members app via Single Sign-On (SSO). Members do not create a separate account or log in via separate passwords or email magic links - their GLM membership is their identity.

---

## 2. Problem Statement

GLM is developing a planned community called Dawrash City. Church members want to own land there, but:

- There is no structured system to manage plot reservations
- Payment tracking is done manually and is prone to error
- Members have no visibility into their own savings progress
- Admin has no central dashboard to monitor the programme
- There is no formal digital covenant or land certificate process

Dawrash City solves all of these.

---

## 3. Goals

| Goal | Metric |
|---|---|
| Give every eligible member a clear view of their savings progress | Dashboard loads with accurate data on first login |
| Enforce membership gate - non-members cannot access the platform | 100% of access attempts validated through GLM Supabase |
| Automate progress tracking from bank transfers | Admin confirms payment → member dashboard updates immediately |
| Provide admin with full programme visibility | Admin can see all members, totals, flags, and certificate queue |
| Legally bind members through a digital covenant | Covenant acceptance recorded in Supabase with timestamp |

---

## 4. Non-Goals (V1)

- Automatic payment reconciliation via bank API (manual admin confirmation in V1)
 - In-app payments via Paystack (card) are supported; bank transfers are a legacy fallback requiring manual admin confirmation in V1
- Member-to-member plot transfers (admin-only process)
- Mobile native app (web app only, mobile-first responsive)
- Multiple land projects (Dawrash City only in V1)
- Direct email magic-link sign-in on Dawrash web app (SSO via GLM app only)

---

## 5. Users

### 5.1 Member
A registered GLM church member who has been approved for the Dawrash City savings programme.

**Entry point:** GLM Members app → Profile → "Open Dawrash City" button  
**Access:** Pure SSO via GLM session token (`/auth/glm?token=<jwt>`)  
**Capabilities:**
- View savings progress and payment history
- Complete onboarding (plot selection + covenant signing)
- Copy payment account number for bank transfers
- View land certificate status

### 5.2 Admin (Super Admin)
A GLM staff member with elevated access to the Dawrash admin panel.

**Entry point:** `/admin` route, authenticated separately  
**Capabilities:**
- View programme-wide savings totals and progress
- Manage all member records
- Confirm and record incoming bank transfers
- Raise and resolve audit flags
- Issue land certificates to completed members

---

## 6. Authentication Flow (Pure SSO)

> **Architectural Note:** GLM Members DB and Dawrash City are **two separate Supabase projects on separate accounts**.
> - **GLM Members DB**: `https://innidgegsjjeclvkskev.supabase.co`
> - **Dawrash City DB**: `https://fzigfgczvaknocznhmsc.supabase.co`

```
Member opens GLM Members app
        ↓
Logs in with their GLM credentials (email + password)
        ↓
Visits Profile page → clicks "Open Dawrash City"
        ↓
GLM app reads active Supabase session token and redirects to:
https://dawrashcity.vercel.app/auth/glm?token=<jwt>
        ↓
/auth/glm route on Dawrash:
  1. Validates GLM JWT via GLM Supabase project (getUser)
  2. Extracts member identity (email, name, GLM member ID)
  3. Upserts profile row in Dawrash DB via Service Role Client
  4. Generates direct server-side session token
  5. Redirects user into Dawrash app:
       - First visit (onboarding incomplete) → /onboarding/plots
       - Returning member                    → /dashboard
```

*Note: Direct email magic-link log-in on Dawrash is disabled. All authentication flows originate from the GLM Members app SSO.*

---

## 7. Onboarding Flow

New members landing on `/onboarding/plots` for the first time complete two steps, which persist data directly to Supabase:

### Step 1 - Plot Selection (`/onboarding/plots`)
- Member selects their desired number of plots (₦2,000,000 per plot) - 1, 2, or more
- Clicks "Continue" → triggers `savePlotSelection` Server Action
- Writes `plots` count to member profile row in Dawrash Supabase
- Members can increase their target at any time from the Profile page; they cannot reduce it below what they have already paid

### Step 2 - Covenant Signing (`/onboarding/covenant`)
- Member reads the full Dawrash City Land Savings Covenant
- Ticks acceptance checkbox and clicks "I Accept & Continue"
- Triggers `acceptCovenant` Server Action
- Records `covenant_signed_at` timestamp, sets `status = 'active'`, and `onboarding_complete = true` in Supabase
- Member is redirected to `/dashboard`

---

## 8. Member Dashboard

### Savings Summary Card
- Progress ring showing percentage saved (0–100%)
- Plots reserved (e.g. "3 Plots in Dawrash City")
- Saved amount, remaining amount, total target
- Animated progress bar
- Milestone badges: 25% · 50% · 75% · 100%

### Payment Account Card
- Bank: Wema Bank
- Account name: DAWRASH / [Member Name]
- NUBAN with one-click copy button
- Instruction: use your name as transfer narration

> Payments (Paystack)
>
> The web app uses Paystack as the primary in-app payment gateway for card payments and instant reconciliation. Members may still use bank transfers as a manual fallback, but Paystack is the recommended route for immediate crediting.
>
> Important: Members are responsible for any Paystack processing fees (commission) charged on each transaction. Display the estimated fee to members before they confirm payment and include the fee policy in all payment flows and user-facing help text.

Note: The platform will surface an estimated Paystack commission for full-target payments. If a member chooses to pay their full remaining target in a single transaction, the UI will display the target amount including the estimated Paystack fees so members understand the total they must pay to fully settle their plot(s) in one payment.

Projection tool: The member payment flow includes a simple projection tool to help members plan multiple equal payments. The UI shows per-payment fee estimates, total fees across all projected payments, and the total charged amount (intended + fees). This projection is for planning only - actual fees may vary slightly depending on Paystack rounding and settlement rules.

### Recent Payments
- Last 5 transactions fetched live from Supabase `transactions` table
- Status badges: green (confirmed), amber (pending), red (failed)
- Link to full transaction history

---

## 9. Transaction History

- Live transaction listing queried from Supabase `transactions` table
- Interactive filter tabs: All · Confirmed · Pending
- Per-row: date, reference, method, amount, status badge
- Summary strip: total saved, pending total, progress %

---

## 10. Profile Page

- Member name, email, initials avatar loaded live from Supabase
- Plot target badge
- Member since date & covenant signed timestamp
- Savings snapshot (saved / target / progress %)
- **Update Target** button - allows active members to increase their plot count; cannot reduce below confirmed-paid plots; hidden for completed members
- Sign out button

---

## 11. Admin Dashboard

### Overview Tab
- 4 stat cards: Members, Total Collected, Total Target, Completed
- Status breakdown bars: Active / Completed / Pending Covenant
- Overall progress ring
- Bar chart: savings vs target per member (Recharts)

### Members Tab
- Searchable, filterable member table
- Filter by status (Active / Completed / Pending Covenant)
- Click row → Member Detail Drawer (profile, progress, transactions)

### Certificate Queue Tab
- Lists completed members eligible for certificates
- "Mark as Issued" action

### Audit Flags Tab
- Lists reconciliation mismatches for admin resolution

---

## 12. Data Model (Dawrash Supabase Project)

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | FK to auth.users.id |
| full_name | text | from GLM app SSO |
| email | text | unique |
| initials | text | derived from full_name |
| glm_member_id | uuid | links back to GLM Members DB |
| plots | smallint | 1 or more; set during onboarding, can be increased from Profile |
| nuban | text | payment account, set by admin |
| bank | text | default Wema Bank |
| status | enum | pending_covenant / active / completed |
| onboarding_complete | boolean | controls redirect on login |
| created_at | timestamptz | member join date |
| covenant_signed_at | timestamptz | set on covenant acceptance |

### `transactions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| member_id | uuid | FK to profiles.id |
| amount_kobo | bigint | naira × 100 |
| method | text | e.g. Bank Transfer |
| status | enum | pending / confirmed / failed |
| reference | text | unique reference |
| paid_at | timestamptz | payment timestamp |

---

## 13. Integrations

### GLM Members DB (`innidgegsjjeclvkskev.supabase.co`)
- **Protocol**: Direct token validation via `getUser(token)` inside `/auth/glm`
- **Purpose**: Authenticate GLM member identity during SSO

### Dawrash Supabase (`fzigfgczvaknocznhmsc.supabase.co`)
- **Protocol**: `@supabase/ssr` server client + Service Role Client
- **Purpose**: Manage Dawrash member sessions, profiles, plots, covenants, and transactions

---

## 14. Security & Environment Variables

- **RLS Enabled**: On all Supabase database tables.
- **Service Role Key**: Stored strictly in `SUPABASE_SERVICE_ROLE_KEY` environment variable. Never exposed to client bundles.
- **SSO Tokens**: Validated server-side on every entry.

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` *(Required on Vercel Dashboard)*
- `MEMBERS_BRIDGE_ANON_KEY`
- `GLM_SUPABASE_URL`
- `NEXT_PUBLIC_SITE_URL`

---

## 15. Routes

| Route | Type | Access | Purpose |
|---|---|---|---|
| `/` | Static | Public | Landing page |
| `/login` | Static | Public | SSO instructions page |
| `/register` | Static | Public | SSO redirection notice |
| `/verify` | Static | Public | SSO guidance |
| `/auth/glm` | Dynamic | Public (JWT required) | SSO entry point |
| `/auth/callback` | Dynamic | Internal | Auth redirect handler |
| `/onboarding/plots` | Static | Authenticated | Plot selection |
| `/onboarding/covenant` | Static | Authenticated | Covenant signing |
| `/dashboard` | Dynamic | Authenticated member | Member dashboard |
| `/transactions` | Dynamic | Authenticated member | Payment history |
| `/profile` | Dynamic | Authenticated member | Member profile |
| `/admin` | Static | Admin only | Admin panel |

## 16. Writing & Content Guidelines

To keep product copy clear, consistent, and human-reviewed, follow these rules when editing the PRD or adding user-facing text in the app.

- **No em dashes or typographic dashes:** Do not use the em dash character (EM DASH) or other typographic dashes in copy. Use simple punctuation: periods, commas, or a plain hyphen (-) only when needed for compound words.
- **Avoid AI slops:** Do not use vague, generic, or marketing-style phrases often produced by generative tools. Examples to avoid: "leveraging", "synergy", "AI-powered", "cutting-edge", "best-in-class". Prefer concrete, specific language describing what the product does and why it matters.
- **Keep sentences short and factual:** Aim for one idea per sentence and avoid flowery or ambiguous wording. Replace abstract claims with concrete outcomes and expected user actions.
- **Provide source and context for copy changes:** When changing UI copy, include the file path and the exact string being changed in the PR description so reviewers can verify the change.
- **Human review required:** Any copy created or suggested by an AI assistant must be reviewed and approved by a human owner before merging to `main`.

These guidelines are authoritative for all future PRD updates and UI text changes in the repository.
