# Dawrash City - Product Requirements Document

**Version:** 2.1
**Last updated:** September 2026
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

**Entry point:** GLM Members app -> Profile -> "Open Dawrash City" button
**Access:** Pure SSO via GLM session token (`/auth/glm?token=<jwt>`)
**Capabilities:**
- View savings progress and payment history
- Complete onboarding (plot selection + covenant signing)
- Make payments directly via Paystack (card, USSD, bank transfer through Paystack)
- Increase their plot target from the Profile page (up to the self-service cap of 5 personal plots)
- Apply for a target increase beyond 5 plots after fully completing payment
- View land certificate status

### 5.2 Admin (Super Admin)
A GLM staff member with elevated access to the Dawrash admin panel.

**Entry point:** `/admin` route, gated by `is_admin` or `is_superadmin` flag on the member profile
**Capabilities:**
- View programme-wide savings totals and progress, including church building plot counter
- Manage all member records (plots, admin roles)
- Record offline payments (cash, POS, direct bank transfers made outside Paystack)
- Manually update transaction statuses (confirm or reject pending transactions)
- Raise and resolve audit flags
- Issue land certificates to completed members and mark delivery
- Run one-time plot cap migration to reset any legacy targets above 5 down to 5

---

## 6. Authentication Flow (Pure SSO)

> **Architectural Note:** GLM Members DB and Dawrash City are **two separate Supabase projects on separate accounts**.
> - **GLM Members DB**: `https://innidgegsjjeclvkskev.supabase.co`
> - **Dawrash City DB**: `https://fzigfgczvaknocznhmsc.supabase.co`

```
Member opens GLM Members app
        |
Logs in with their GLM credentials (email + password)
        |
Visits Profile page -> clicks "Open Dawrash City"
        |
GLM app reads active Supabase session token and redirects to:
https://dawrashcity.com/auth/glm?token=<jwt>
        |
/auth/glm route on Dawrash:
  1. Validates GLM JWT via GLM Supabase project (getUser)
  2. Extracts member identity (email, name, GLM member ID)
  3. Upserts profile row in Dawrash DB via Service Role Client
  4. Generates direct server-side session token
  5. Redirects user into Dawrash app:
       - First visit (onboarding incomplete) -> /onboarding/plots
       - Returning member                    -> /dashboard
```

*Note: Direct email magic-link log-in on Dawrash is disabled. All authentication flows originate from the GLM Members app SSO.*

---

## 7. Plot Pricing Model

Each plot costs **N1,000,000**. Every personal plot a member purchases is paired with one church-building plot, also funded by the member. This means:

- A member who selects 1 personal plot commits to paying **N2,000,000** total (1 personal + 1 church)
- A member who selects 3 personal plots commits to paying **N6,000,000** total (3 personal + 3 church)
- The member's dashboard shows their personal plot count (e.g. "3 Plots") and their total payment commitment

The church-building plots are tracked separately in the admin overview as a running total. They are not assigned to members - they go to the Gospel Labour Ministry church building project.

**Self-service cap:** Members may select between 1 and 5 personal plots during onboarding or via the Update Target flow. To go beyond 5, a member must fully complete payment for their current target and then submit a Target Increase Request for admin approval.

---

## 8. Onboarding Flow

New members landing on `/onboarding/plots` for the first time complete two steps, which persist data directly to Supabase:

### Step 1 - Plot Selection (`/onboarding/plots`)
- Member selects their desired number of personal plots (1 to 5)
- Each option card shows: personal plots, matching church plots, and total payment amount
- A pricing explainer box shows the N1,000,000 per plot breakdown
- Clicks "Continue" -> triggers `savePlotSelection` Server Action
- Writes `plots` count to member profile row in Dawrash Supabase
- Members can update their target at any time from the Profile page (within the 5-plot self-service cap)

### Step 2 - Covenant Signing (`/onboarding/covenant`)
- Member reads the full Dawrash City Land Savings Covenant (Version 2.0)
- The covenant text reflects the paired plot model: N1,000,000 per plot, N2,000,000 total per personal plot selected
- Ticks acceptance checkbox and clicks "I Accept & Continue"
- Triggers `acceptCovenant` Server Action
- Records `covenant_signed_at` timestamp, sets `status = 'active'`, and `onboarding_complete = true` in Supabase
- Member is redirected to `/dashboard`

---

## 9. Target Management

### Self-service updates (active members)
Active members (status = active) with fewer than 5 personal plots can adjust their target from the Profile page using the Update Target dialog. The dialog:
- Shows personal plot count, matching church plot count, and total payment amount
- Prevents reducing the target below the number of personal plots already fully paid
- Caps the increment at 5 personal plots

### Target increase requests (completed members)
Members who have fully paid for all their personal plots (status = completed) and are at the 5-plot cap can submit a Target Increase Request. The request:
- Is stored in the `target_increase_requests` Supabase table
- Requires the member to specify how many total personal plots they want
- Allows an optional reason
- Blocks duplicate pending requests
- Is reviewed and approved or rejected by an admin

### Legacy migration
Members registered under the old N2,000,000/plot model had their plots reset to 0. They are required to re-select their target from the Profile page under the new pricing model. The admin Overview panel includes a one-time "Cap Plots to 5" button that sets any member with plots > 5 down to exactly 5. Members with 0-5 plots are untouched.

---

## 10. Member Dashboard

### Savings Summary Card
- Progress ring showing percentage saved (0-100%)
- Personal plots reserved (e.g. "3 Plots personal + 3 church")
- Total payment commitment (e.g. N6,000,000)
- Saved amount, remaining amount, total target
- Animated progress bar with milestone badges at 25%, 50%, 75%, 100%
- Stat showing how many personal plots are fully paid and how many church plots have been funded

### Quick Stats
- Member since date
- Payment count (confirmed and pending)
- Church plots funded
- Covenant status

### Recent Payments
- Last 5 transactions fetched live from Supabase `transactions` table
- Status badges: green (confirmed), amber (pending), red (failed)
- Link to full transaction history

---

## 11. Payment Flow

### Primary path - Paystack inline checkout (`/transactions`)
Members pay directly inside the app via the Paystack inline SDK (card, USSD, bank transfer through Paystack). The full automated flow:

```
Member enters amount on /transactions page
        |
UI calculates Paystack fee and shows total charge before confirmation
        |
Member clicks "Pay with Paystack"
        |
POST /api/paystack/initiate
  - Calls Paystack transaction/initialize API
  - Embeds member_id and intended_amount_kobo in Paystack metadata
  - Returns authorization reference to client
        |
Paystack inline popup opens (PaystackPop SDK)
        |
Member completes payment on Paystack
        |
Paystack fires charge.success webhook -> POST /api/paystack/webhook
  - HMAC-SHA512 signature verified
  - Transaction upserted into Supabase transactions table
  - status set to 'confirmed', method set to 'Paystack'
  - intended_amount_kobo recovered from metadata (net savings credit, before fees)
  - Auto-completion check: if total confirmed >= plots x N2,000,000, status set to 'completed'
  - Idempotent: safe to re-deliver
        |
Member's dashboard and transaction history reflect the confirmed payment
```

No admin action is required for Paystack payments. The webhook handles reconciliation end-to-end.

### Fee handling
Members are responsible for all Paystack processing fees. The UI calculates and displays the estimated fee before payment:
- Fee formula: `round(intendedAmount x 1.5%) + N100` (configurable via env vars)
- The intended amount (net savings credit) is stored in `transactions.amount_kobo`
- The total charged amount (including fee) is stored in `transactions.charged_amount_kobo`
- A fee breakdown and installment projection tool is available to help members plan contributions

### Offline payments (admin-only fallback)
Cash deposits, POS transfers, and direct bank transfers made outside Paystack cannot be auto-reconciled. Admins record these manually via the "Record Offline Transfer" form in the admin panel. Offline transactions are recorded immediately as `confirmed` with `fee_kobo = 0`.

---

## 12. Transaction History

- Live transaction listing queried from Supabase `transactions` table
- Interactive filter tabs: All / Confirmed / Pending / Failed
- Per-row: date, reference, method, amount, fee (if any), status badge
- Summary strip: total saved, pending total, progress %

---

## 13. Profile Page

- Member name, email, initials avatar loaded live from Supabase
- Personal plot target badge
- Member since date and covenant signed timestamp
- Savings snapshot: saved / target / progress % with church contribution note
- **Update Target** button - visible for active members with fewer than 5 personal plots. Shows paired cost breakdown. Cannot reduce below confirmed-paid plots.
- **Request Increase** button - visible for completed members at the 5-plot cap. Submits a target increase request for admin review.
- Signed covenant text (Version 2.0)
- Sign out button

---

## 14. Admin Dashboard

### Overview Tab
- 5 stat cards: Total Inflows Collected, Personal Plots Reserved, Church Building Plots, Church Savers count, Audit Discrepancies
- Church Building Plots card shows total church plots reserved (always equal to personal plots reserved) and how many are fully funded
- Status breakdown bars: Active / Completed / Pending Covenant
- Overall progress ring
- One-time "Cap Plots to 5" maintenance button - visible only when any member has plots > 5. Opens a confirmation dialog showing how many members will be affected.

### Members Tab
- Searchable, filterable member table
- Filter by status (Active / Completed / Pending Covenant)
- Click row -> Member Detail Drawer (profile, progress, transactions)
- Admin can update a member's plot count and admin role from the drawer

### Transactions Tab
- Full ledger of all transactions (Paystack and offline)
- Searchable by reference, member name, email, or notes
- Filter by status: All / Confirmed / Pending / Failed
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

## 15. Data Model (Dawrash Supabase Project)

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | FK to auth.users.id |
| full_name | text | from GLM app SSO |
| email | text | unique |
| initials | text | derived from full_name |
| glm_member_id | uuid | links back to GLM Members DB |
| plots | smallint | personal plot target (1-5); set during onboarding, updatable from Profile up to the cap |
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
| amount_kobo | bigint | intended savings credit (naira x 100, excluding fee) |
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

### `target_increase_requests`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| member_id | uuid | FK to profiles.id |
| current_plots | int | member's plot count at time of request |
| requested_plots | int | total personal plots being requested |
| reason | text | optional note from the member |
| status | text | pending / approved / rejected |
| reviewed_by | uuid | nullable FK to profiles.id (admin who reviewed) |
| reviewed_at | timestamptz | review timestamp |
| created_at | timestamptz | request submission timestamp |

---

## 16. API Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/health` | GET | None | Checks required env vars; returns `{ ok, missing }` |
| `/api/paystack/initiate` | POST | Session | Calls Paystack `transaction/initialize`; returns reference |
| `/api/paystack/webhook` | POST | HMAC sig | Receives Paystack events; upserts transactions into Supabase |

---

## 17. Integrations

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

## 18. Security & Environment Variables

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
- `NEXT_PUBLIC_PAYSTACK_FIXED_FEE_KOBO` - default `10000` (N100)

**App**
- `NEXT_PUBLIC_SITE_URL`

### Development Overrides
- `DEV_FORCE_EMAIL` *(development only)*: forces a demo member session when `NODE_ENV=development`. Store in `.env.local`, do not commit.
- `DEV_FORCE_NAME` *(development only)*: display name used when `DEV_FORCE_EMAIL` is set.

---

## 19. Routes

| Route | Type | Access | Purpose |
|---|---|---|---|
| `/` | Static | Public | Landing page |
| `/login` | Static | Public | SSO instructions page |
| `/register` | Static | Public | SSO redirection notice |
| `/verify` | Static | Public | SSO guidance |
| `/auth/glm` | Dynamic | Public (JWT required) | SSO entry point |
| `/auth/callback` | Dynamic | Internal | Auth redirect handler |
| `/onboarding/plots` | Static | Authenticated | Plot selection (1-5 personal plots) |
| `/onboarding/covenant` | Static | Authenticated | Covenant signing |
| `/dashboard` | Dynamic | Authenticated member | Member dashboard |
| `/transactions` | Dynamic | Authenticated member | Payment history and Paystack checkout |
| `/profile` | Dynamic | Authenticated member | Member profile and target management |
| `/admin` | Dynamic | Admin only | Admin panel |

---

## 20. Writing & Content Guidelines

These rules apply to all user-facing copy in the app and all text in this PRD. They are not suggestions.

### No em dashes

Do not use the em dash character (U+2014) anywhere in app copy or this document. It is not permitted in JSX strings, button labels, descriptions, toast messages, dialog text, or inline comments that appear in UI.

Use a comma, a period, or a plain hyphen (-) instead. A plain hyphen is only acceptable in compound words (e.g. "church-building plot"), not as a sentence separator.

Wrong: `Each plot is paired with a church plot - both funded by you`
Right: `Each plot is paired with a church plot, funded by you.`

### No AI slop

Do not use vague or inflated language. The following words and phrases are banned from app copy and PRD text:

- leveraging, synergy, seamless, robust, cutting-edge, best-in-class
- empower, supercharge, unlock, transform, revolutionize
- AI-powered, next-generation, world-class, state-of-the-art
- "we believe", "our mission", "at the heart of"

Replace every instance with a concrete, factual description of what the product does or what the user will see.

Wrong: `Seamlessly track your savings journey`
Right: `See how much you have saved and how much is left.`

### Short sentences

One idea per sentence. If a sentence needs more than one clause, split it.

### Numbers and currency

Always write naira amounts with the naira sign and commas. Do not abbreviate.

Right: N1,000,000 / N2,000,000 / N6,000,000
Wrong: 1M, N1M, 1,000,000 naira

### Human review required

Any copy written or suggested by an AI assistant must be reviewed and approved by a human owner before it is merged to `main`. The reviewer must check for em dashes, slop phrases, and currency formatting before approving.
