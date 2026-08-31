# Dawrash City - Product Requirements Document

**Version:** 1.2
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
| Automate payment reconciliation end-to-end via Paystack webhooks | Confirmed payment reflects on member dashboard without any admin action |
| Provide admin with full programme visibility | Admin can see all members, totals, flags, and certificate queue |
| Legally bind members through a digital covenant | Covenant acceptance recorded in Supabase with timestamp |

---

## 4. Non-Goals (V1)

- Automatic reconciliation of direct offline bank transfers (cash, POS, or transfers made outside Paystack) - these require manual admin recording
- Member-to-member plot transfers (admin-only process)
- Mobile native app (web app only, mobile-first responsive)
- Multiple land projects (Dawrash City only in V1)
- Direct email magic-link sign-in on Dawrash web app (SSO via GLM app only)
- Auto-creation of audit flags on payment mismatch (flags are created manually by superadmin directly in Supabase)

---

## 5. Users

### 5.1 Member
A registered GLM church member who has been approved for the Dawrash City savings programme.

**Entry point:** GLM Members app → Profile → "Open Dawrash City" button
**Access:** Pure SSO via GLM session token (`/auth/glm?token=<jwt>`)
**Capabilities:**
- View savings progress and payment history
- Complete onboarding (plot selection + covenant signing)
- Make payments directly via Paystack (card, USSD, bank transfer through Paystack)
- Increase their plot target from the Profile page
- View land certificate status

### 5.2 Admin (Super Admin)
A GLM staff member with elevated access to the Dawrash admin panel.

**Entry point:** `/admin` route, gated by `is_admin` or `is_superadmin` flag on the member profile
**Capabilities:**
- View programme-wide savings totals and progress
- Manage all member records (plots, admin roles)
- Record offline payments (cash, POS, direct bank transfers made outside Paystack)
- Manually update transaction statuses (confirm or reject pending transactions)
- Raise and resolve audit flags
- Issue land certificates to completed members and mark delivery

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
- Progress ring showing percentage saved (0-100%)
- Plots reserved (e.g. "3 Plots in Dawrash City")
- Saved amount, remaining amount, total target
- Animated progress bar
- Milestone badges: 25% · 50% · 75% · 100%

### Recent Payments
- Last 5 transactions fetched live from Supabase `transactions` table
- Status badges: green (confirmed), amber (pending), red (failed)
- Link to full transaction history

---

## 9. Payment Flow

### Primary path - Paystack inline checkout (`/transactions`)
Members pay directly inside the app via the Paystack inline SDK (card, USSD, bank transfer through Paystack). The full automated flow:

```
Member enters amount on /transactions page
        ↓
UI calculates Paystack fee and shows total charge before confirmation
        ↓
Member clicks "Pay with Paystack"
        ↓
POST /api/paystack/initiate
  - Calls Paystack transaction/initialize API
  - Embeds member_id and intended_amount_kobo in Paystack metadata
  - Returns authorization reference to client
        ↓
Paystack inline popup opens (PaystackPop SDK)
        ↓
Member completes payment on Paystack
        ↓
Paystack fires charge.success webhook → POST /api/paystack/webhook
  - HMAC-SHA512 signature verified
  - Transaction upserted into Supabase transactions table
  - status set to 'confirmed', method set to 'Paystack'
  - intended_amount_kobo recovered from metadata (net savings credit, before fees)
  - Idempotent: safe to re-deliver
        ↓
Member's dashboard and transaction history reflect the confirmed payment
```

No admin action is required for Paystack payments. The webhook handles reconciliation end-to-end.

### Fee handling
Members are responsible for all Paystack processing fees. The UI calculates and displays the estimated fee before payment:
- Fee formula: `round(intendedAmount × 1.5%) + ₦100` (configurable via env vars)
- The intended amount (net savings credit) is stored in `transactions.amount_kobo`
- The total charged amount (including fee) is stored in `transactions.charged_amount_kobo`
- A fee breakdown and installment projection tool is available to help members plan contributions

### Offline payments (admin-only fallback)
Cash deposits, POS transfers, and direct bank transfers made outside Paystack cannot be auto-reconciled. Admins record these manually via the "Record Offline Transfer" form in the admin panel. Offline transactions are recorded immediately as `confirmed` with `fee_kobo = 0`.

---

## 10. Transaction History

- Live transaction listing queried from Supabase `transactions` table
- Interactive filter tabs: All · Confirmed · Pending · Failed
- Per-row: date, reference, method, amount, fee (if any), status badge
- Summary strip: total saved, pending total, progress %

---

## 11. Profile Page

- Member name, email, initials avatar loaded live from Supabase
- Plot target badge
- Member since date & covenant signed timestamp
- Savings snapshot (saved / target / progress %)
- **Update Target** button - allows active members to increase their plot count; cannot reduce below confirmed-paid plots; hidden for completed members
- Sign out button

---

## 12. Admin Dashboard

### Overview Tab
- 4 stat cards: Members, Total Collected, Total Target, Completed
- Status breakdown bars: Active / Completed / Pending Covenant
- Overall progress ring
- Bar chart: savings vs target per member (Recharts)

### Members Tab
- Searchable, filterable member table
- Filter by status (Active / Completed / Pending Covenant)
- Click row → Member Detail Drawer (profile, progress, transactions)
- Admin can update a member's plot count and admin role from the drawer

### Transactions Tab
- Full ledger of all transactions (Paystack and offline)
- Searchable by reference, member name, email, or notes
- Filter by status: All · Confirmed · Pending · Failed
- Pending transactions show Confirm and Reject action buttons
- "Record Offline Transfer" button for cash, POS, and direct bank payments

### Certificate Queue Tab
- Lists completed members eligible for certificates
- Admin enters plot numbers and clicks "Issue Certificate"
- Delivered certificates can be marked as delivered with a timestamp

### Audit Flags Tab
- Lists reconciliation discrepancies raised by superadmin
- Each flag shows: member, reference, expected vs recorded amount, variance, and notes
- "Resolve Discrepancy" marks the flag resolved with a timestamp
- Resolved flags move to the audit trail section
- Note: flags are created manually by superadmin directly in Supabase (no auto-creation in V1)

---

## 13. Data Model (Dawrash Supabase Project)

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
| is_admin | boolean | grants access to admin panel |
| is_superadmin | boolean | grants elevated admin privileges |
| created_at | timestamptz | member join date |
| covenant_signed_at | timestamptz | set on covenant acceptance |
| updated_at | timestamptz | last profile update |

### `transactions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| member_id | uuid | FK to profiles.id |
| amount_kobo | bigint | intended savings credit (naira × 100, excluding fee) |
| charged_amount_kobo | bigint | total amount charged to member including Paystack fee |
| intended_amount_kobo | bigint | same as amount_kobo; preserved from Paystack metadata |
| fee_kobo | bigint | Paystack fee kobo; 0 for offline transactions |
| method | text | 'Paystack', 'Direct Bank Transfer', 'Cash Deposit', etc. |
| status | enum | pending / confirmed / failed |
| reference | text | unique reference (e.g. DWR-8842 or Paystack ref) |
| notes | text | superadmin audit notes for offline transactions |
| paid_at | timestamptz | payment timestamp |
| created_at | timestamptz | row creation timestamp |
| updated_at | timestamptz | last status update |

### `audit_flags`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| transaction_id | uuid | nullable FK to transactions.id |
| member_id | uuid | FK to profiles.id |
| reference | text | payment reference under review |
| expected_kobo | bigint | amount that should have been recorded |
| recorded_kobo | bigint | amount actually recorded |
| variance_kobo | bigint | difference; computed as recorded - expected |
| note | text | description of the discrepancy |
| resolved | boolean | false until superadmin resolves |
| resolved_at | timestamptz | set when resolved |
| created_at | timestamptz | flag creation timestamp |

### `certificates`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| member_id | uuid | unique FK to profiles.id |
| plot_numbers | text | assigned plot number string |
| issued_at | timestamptz | certificate issue date |
| delivered | boolean | whether physical certificate was delivered |
| delivered_at | timestamptz | delivery date |
| created_at | timestamptz | row creation timestamp |

---

## 14. API Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/health` | GET | None | Checks required env vars; returns `{ ok, missing }` |
| `/api/paystack/initiate` | POST | Session | Calls Paystack `transaction/initialize`; returns reference |
| `/api/paystack/webhook` | POST | HMAC sig | Receives Paystack events; upserts transactions into Supabase |

---

## 15. Integrations

### GLM Members DB (`innidgegsjjeclvkskev.supabase.co`)
- **Protocol**: Direct token validation via `getUser(token)` inside `/auth/glm`
- **Purpose**: Authenticate GLM member identity during SSO

### Dawrash Supabase (`fzigfgczvaknocznhmsc.supabase.co`)
- **Protocol**: `@supabase/ssr` server client + Service Role Client
- **Purpose**: Manage Dawrash member sessions, profiles, plots, covenants, and transactions

### Paystack
- **Initiate**: `POST https://api.paystack.co/transaction/initialize` via `/api/paystack/initiate`
- **Webhook**: `POST /api/paystack/webhook` receives `charge.success` and other events
- **Client SDK**: PaystackPop inline JS loaded dynamically on the transactions page
- **Purpose**: End-to-end automated payment collection and reconciliation

---

## 16. Security & Environment Variables

- **RLS Enabled**: On all Supabase database tables.
- **Service Role Key**: Stored strictly in `SUPABASE_SERVICE_ROLE_KEY` environment variable. Never exposed to client bundles.
- **SSO Tokens**: Validated server-side on every entry.
- **Paystack Webhook Signature**: Every webhook POST is verified via HMAC-SHA512 against `PAYSTACK_SECRET_KEY` before any DB write.

### Required Environment Variables

**Supabase (Dawrash City project)**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**GLM SSO Bridge**
- `GLM_SUPABASE_URL`
- `MEMBERS_BRIDGE_ANON_KEY`
- `SUPABASE_JWT_SECRET`
- `MEMBERS_BRIDGE_URL`
- `MEMBERS_BRIDGE_SECRET`

**Paystack**
- `PAYSTACK_SECRET_KEY` - server-only; used to sign/verify webhooks and call Paystack API
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - client-side; passed to PaystackPop SDK
- `NEXT_PUBLIC_PAYSTACK_FEE_PERCENT` - default `0.015` (1.5%)
- `NEXT_PUBLIC_PAYSTACK_FIXED_FEE_KOBO` - default `10000` (₦100)

**App**
- `NEXT_PUBLIC_SITE_URL`

### Development Overrides
- `DEV_FORCE_EMAIL` *(development only)*: forces a demo member session when `NODE_ENV=development`. Store in `.env.local`, do not commit.
- `DEV_FORCE_NAME` *(development only)*: display name used when `DEV_FORCE_EMAIL` is set.

---

## 17. Routes

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
| `/transactions` | Dynamic | Authenticated member | Payment history and Paystack checkout |
| `/profile` | Dynamic | Authenticated member | Member profile and target management |
| `/admin` | Dynamic | Admin only | Admin panel |

---

## 18. Writing & Content Guidelines

To keep product copy clear, consistent, and human-reviewed, follow these rules when editing the PRD or adding user-facing text in the app.

- **No em dashes or typographic dashes:** Do not use the em dash character (EM DASH) or other typographic dashes in copy. Use simple punctuation: periods, commas, or a plain hyphen (-) only when needed for compound words.
- **Avoid AI slops:** Do not use vague, generic, or marketing-style phrases often produced by generative tools. Examples to avoid: "leveraging", "synergy", "AI-powered", "cutting-edge", "best-in-class". Prefer concrete, specific language describing what the product does and why it matters.
- **Keep sentences short and factual:** Aim for one idea per sentence and avoid flowery or ambiguous wording. Replace abstract claims with concrete outcomes and expected user actions.
- **Provide source and context for copy changes:** When changing UI copy, include the file path and the exact string being changed in the PR description so reviewers can verify the change.
- **Human review required:** Any copy created or suggested by an AI assistant must be reviewed and approved by a human owner before merging to `main`.

These guidelines are authoritative for all future PRD updates and UI text changes in the repository.
