# Dawrash City - Product Requirements Document

**Version:** 3.0
**Last updated:** September 2026
**Status:** Active Development
**Owner:** Gospel Labour Ministry (GLM)

---

## 1. Overview

Dawrash City is a faith-based land savings platform built exclusively for registered members of Gospel Labour Ministry (GLM). It enables members to reserve plots of land within the Dawrash City development project, track their savings progress, and receive land certificates upon full payment.

The platform is accessed exclusively through the GLM Members app via Single Sign-On (SSO). Members do not create a separate account or log in via separate passwords or email magic links. Their GLM membership is their identity.

Every member who visits the platform for the first time is automatically assigned 1 personal plot. Members who want a second plot must apply through the "Apply for More" form after completing full payment for their first plot.

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
| Provide admin with full programme visibility | Admin can see all members, totals, flags, applications, and certificate queue |
| Legally bind members through a digital covenant | Covenant acceptance recorded in Supabase with timestamp |
| Give every first-time member a plot without friction | Every new member automatically gets 1 personal plot on first visit |

---

## 4. Non-Goals (V1)

- Automatic reconciliation of direct offline bank transfers (cash, POS, or transfers made outside Paystack) - these require manual admin recording
- Member-to-member plot transfers (admin-only process)
- Mobile native app (web app only, mobile-first responsive)
- Multiple land projects (Dawrash City only in V1)
- Direct email magic-link sign-in on Dawrash web app (SSO via GLM app only)
- Auto-creation of audit flags on payment mismatch (flags are created manually by superadmin directly in Supabase)
- Applying for more than 2 personal plots in total (the current maximum is 2)

---

## 5. Users

### 5.1 Member
A registered GLM church member who has been approved for the Dawrash City savings programme.

**Entry point:** GLM Members app -> Profile -> "Open Dawrash City" button
**Access:** Pure SSO via GLM session token (`/auth/glm?token=<jwt>`)
**Capabilities:**
- Automatically receive 1 personal plot on first visit (no selection required)
- Complete onboarding (covenant signing only)
- View savings progress and payment history
- Make payments directly via Paystack (card, USSD, bank transfer through Paystack)
- Apply for a second plot after completing full payment for the first plot
- View land certificate status

### 5.2 Admin (Super Admin)
A GLM staff member with elevated access to the Dawrash admin panel.

**Entry point:** `/admin` route, gated by `is_admin` or `is_superadmin` flag on the member profile
**Capabilities:**
- View programme-wide savings totals and progress, including church building plot counter
- Manage all member records (plots, admin roles)
- Record offline payments (cash, POS, direct bank transfers made outside Paystack)
- Manually update transaction statuses (confirm or reject pending transactions)
- Review, approve, or reject "Apply for More" plot applications
- Raise and resolve audit flags
- Issue land certificates to completed members and mark delivery

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
     - sets plots = 1 for new members automatically
  4. Generates direct server-side session token
  5. Redirects user into Dawrash app:
       - First visit (onboarding incomplete) -> /onboarding/covenant
       - Returning member                    -> /dashboard
```

*Note: Direct email magic-link log-in on Dawrash is disabled. All authentication flows originate from the GLM Members app SSO.*

---

## 7. Plot Pricing Model

Each plot costs **N1,000,000**. Every personal plot a member holds is paired with one church-building plot, also funded by the member. This means:

- Every member is automatically assigned 1 personal plot on first visit. Their total payment commitment is **N2,000,000** (1 personal + 1 church).
- A member approved for 2 personal plots commits to paying **N4,000,000** total (2 personal + 2 church).
- The maximum personal plot allocation per member is **2 plots**.
- The member's dashboard shows their personal plot count (e.g. "2 Plots") and their total payment commitment.

The church-building plots are tracked separately in the admin overview as a running total. They are not assigned to members. They go to the Gospel Labour Ministry church building project.

**No self-service target changes.** Members do not select or adjust their own plot count. 1 plot is assigned automatically. To hold 2 plots, a member must apply through the "Apply for More" form after fully completing payment for their first plot.

---

## 8. Onboarding Flow

New members landing on `/onboarding/covenant` for the first time complete one step only.

> The plot selection step (`/onboarding/plots`) has been removed. `plots = 1` is written to the member's profile automatically at first login via the `/auth/glm` SSO handler.

### Covenant Signing (`/onboarding/covenant`)
- Member reads the full Dawrash City Land Savings Covenant (Version 2.0)
- The covenant text reflects the new model: 1 personal plot, N2,000,000 total commitment
- Ticks acceptance checkbox and clicks "I Accept & Continue"
- Triggers `acceptCovenant` Server Action
- Records `covenant_signed_at` timestamp, sets `status = 'active'`, and `onboarding_complete = true` in Supabase
- Member is redirected to `/dashboard`

---

## 9. Apply for More (Second Plot)

Members who have fully paid for their first personal plot (status = completed) may apply for a second plot. This is the only way to increase from 1 to 2 plots.

### Eligibility
- `status === 'completed'` (full payment confirmed for 1 plot, i.e. N2,000,000 confirmed)
- No existing pending application

### Application Form Fields
| Field | Type | Required |
|---|---|---|
| Full Name | Text (pre-filled from profile, editable) | Yes |
| Phone Number | Text | Yes |
| Pastor's Name | Text | Yes |
| Auxano Center | Text (cell/home unit name) | Yes |
| Residential Address | Text | Yes |
| Occupation | Text | Yes |

### Flow
1. Member clicks "Apply for More" on their Profile page
2. A dialog opens with the 6-field form
3. On submission, the application is stored in `target_increase_requests` with `status = 'pending'`
4. Member sees a confirmation message and the button is replaced with "Application Pending"
5. Admin reviews the application and either approves or rejects it
6. On approval, the member's `profiles.plots` is set to 2 and their target becomes N4,000,000
7. On rejection, the member is notified and may apply again (one pending application at a time)

### Rules
- A member may only have one pending application at a time
- The maximum total plots via this flow is 2
- Only completed members (not active members still saving toward plot 1) may apply
- Admin approval sets `plots = 2` directly. No further self-service target change is available.

---

## 10. Member Dashboard

### Savings Summary Card
- Progress ring showing percentage saved (0-100%)
- Personal plots reserved (e.g. "1 Plot personal + 1 church" or "2 Plots personal + 2 church")
- Total payment commitment (e.g. N2,000,000 or N4,000,000)
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
- **Apply for More** button - visible only for completed members (status = completed) with no existing pending application. Opens the 6-field application form dialog.
- **Application Pending** notice - replaces the "Apply for More" button when a pending application exists
- Signed covenant text (Version 2.0)
- Sign out button

---

## 14. Admin Dashboard

### Overview Tab
- 5 stat cards: Total Inflows Collected, Personal Plots Reserved, Church Building Plots, Church Savers count, Pending Applications count
- Church Building Plots card shows total church plots reserved (always equal to personal plots reserved) and how many are fully funded
- Status breakdown bars: Active / Completed / Pending Covenant
- Overall progress ring
- Pending Applications badge on the Applications tab when there are unreviewed submissions

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

### Applications Tab (new)
- Lists all "Apply for More" submissions from members
- Filter by status: All / Pending / Approved / Rejected
- Each row shows: member name, email, submission date, Pastor's Name, Auxano Center, Phone, Residential Address, Occupation
- Pending applications show Approve and Reject action buttons
- Approve sets `profiles.plots = 2` and `target_increase_requests.status = 'approved'`
- Reject sets `target_increase_requests.status = 'rejected'`; member may reapply

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
| plots | smallint | personal plot target (1 or 2); auto-set to 1 on first visit, set to 2 on application approval |
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
Extended to store the full "Apply for More" application fields.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| member_id | uuid | FK to profiles.id |
| current_plots | int | member's plot count at time of request (always 1 currently) |
| requested_plots | int | total personal plots being requested (always 2 currently) |
| full_name | text | applicant's full name as submitted |
| phone_number | text | applicant's phone number |
| pastor_name | text | name of the applicant's pastor |
| auxano_center | text | applicant's Auxano cell/home unit name |
| residential_address | text | applicant's home address |
| occupation | text | applicant's occupation |
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
| `/onboarding/covenant` | Static | Authenticated | Covenant signing (1 step only) |
| `/dashboard` | Dynamic | Authenticated member | Member dashboard |
| `/transactions` | Dynamic | Authenticated member | Payment history and Paystack checkout |
| `/profile` | Dynamic | Authenticated member | Member profile and Apply for More |
| `/admin` | Dynamic | Admin only | Admin panel |

Note: `/onboarding/plots` no longer exists as an active route. Any visit to it redirects to `/onboarding/covenant`.

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

Right: N1,000,000 / N2,000,000 / N4,000,000
Wrong: 1M, N1M, 1,000,000 naira

### Human review required

Any copy written or suggested by an AI assistant must be reviewed and approved by a human owner before it is merged to `main`. The reviewer must check for em dashes, slop phrases, and currency formatting before approving.
