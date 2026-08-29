# Dawrash City — Product Requirements Document

**Version:** 1.0  
**Last updated:** August 2026  
**Status:** Active Development  
**Owner:** Gospel Labour Ministry (GLM)

---

## 1. Overview

Dawrash City is a faith-based land savings platform built exclusively for registered members of Gospel Labour Ministry (GLM). It enables members to reserve plots of land within the Dawrash City development project, track their savings progress, and receive land certificates upon full payment.

The platform is accessed through the GLM Members app via Single Sign-On (SSO). Members do not create a separate account — their GLM membership is their identity.

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
| Enforce membership gate — non-members cannot access the platform | 100% of access attempts validated through GLM bridge |
| Automate progress tracking from bank transfers | Admin confirms payment → member dashboard updates immediately |
| Provide admin with full programme visibility | Admin can see all members, totals, flags, and certificate queue |
| Legally bind members through a digital covenant | Covenant acceptance recorded with timestamp |

---

## 4. Non-Goals (V1)

- Automatic payment reconciliation via bank API (manual admin confirmation in V1)
- In-app payment via card or Paystack (bank transfer only in V1)
- Member-to-member plot transfers (admin-only process)
- Mobile native app (web app only, mobile-first responsive)
- Multiple land projects (Dawrash City only in V1)

---

## 5. Users

### 5.1 Member
A registered GLM church member who has been approved for the Dawrash City savings programme.

**Entry point:** GLM Members app → Profile → "Open Dawrash City" button  
**Access:** SSO via GLM session token — no separate password  
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

## 6. Authentication Flow

```
Member opens GLM Members app
        ↓
Logs in with their GLM credentials (email + password)
        ↓
Visits Profile page → clicks "Open Dawrash City"
        ↓
GLM app reads the active Supabase session token
Appends it to: https://dawrashcity.vercel.app/auth/glm?token=<jwt>
        ↓
/auth/glm route on Dawrash:
  1. Verifies JWT using shared secret
  2. Extracts member identity (email, name, GLM member ID)
  3. Upserts profile row in Dawrash DB
  4. Generates a Dawrash magic link via service role
  5. Redirects through Supabase verify → /auth/callback
        ↓
/auth/callback:
  - First visit → /onboarding/plots
  - Returning   → /dashboard
```

Members can also sign in directly on Dawrash via `/login` using their church email. The bridge validates membership and sends a magic link.

---

## 7. Onboarding Flow

New members who land on `/onboarding/plots` for the first time go through two steps:

### Step 1 — Plot Selection (`/onboarding/plots`)
- Member selects 1, 2, or 3 plots
- Each plot costs ₦2,000,000
- Target is locked permanently after this step
- Cannot be changed without admin intervention

### Step 2 — Covenant Signing (`/onboarding/covenant`)
- Member reads the full Dawrash City Land Savings Covenant
- Must scroll through and tick acceptance checkbox
- Acceptance is recorded with timestamp
- Member status changes from `pending_covenant` to `active`
- Member is redirected to dashboard

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

### Recent Payments
- Last 5 transactions with date, amount, method, status
- Colour coded: green (confirmed), amber (pending), red (failed)
- Link to full transaction history

### Quick Stats Row
- Member since date
- Total confirmed payments count
- Covenant signed status

---

## 9. Transaction History

- Full paginated list of all transfers
- Filter tabs: All · Confirmed · Pending · Failed
- Per-row: date, reference, method, amount, status badge
- Summary strip: total saved, pending total, progress %
- Empty state with clear messaging

---

## 10. Profile Page

- Member name, email, initials avatar
- Plot target badge
- Member since date
- Covenant signed date
- Savings snapshot (saved / target / progress %)
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
- Inline mini progress bar per member row
- Click row → Member Detail Drawer:
  - Full profile info
  - Progress ring and amount breakdown
  - Full transaction history
  - Covenant signed date

### Certificate Queue Tab
- Lists all members with `completed` status
- "Mark as Issued" button per member
- Issued-this-session log

### Audit Flags Tab
- Lists reconciliation mismatches
- Shows: member name, reference, expected amount, recorded amount, variance
- "Resolve" button per flag
- Resolved-this-session log

---

## 12. Data Model

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | mirrors auth.users.id |
| full_name | text | from GLM bridge |
| email | text | unique |
| initials | text | derived from full_name |
| glm_member_id | uuid | links back to GLM Members DB |
| plots | smallint | 0–3, set at onboarding |
| nuban | text | payment account, set by admin |
| bank | text | default Wema Bank |
| status | enum | pending_covenant / active / completed |
| onboarding_complete | boolean | controls redirect on login |
| member_since | date | |
| covenant_signed_at | timestamptz | |

### `transactions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| member_id | uuid | FK to profiles |
| amount_kobo | bigint | naira × 100 |
| method | text | e.g. Bank Transfer |
| status | enum | pending / confirmed / failed |
| reference | text | unique, bank reference |
| paid_at | date | |

### `audit_flags`
Links transaction + member. Stores expected vs recorded amount. `variance_kobo` is a generated column.

### `certificates`
One row per completed member. Created automatically by DB trigger when savings reach 100%.

---

## 13. Business Rules

1. **Plot target is permanent.** Once set during onboarding it cannot be changed by the member. Admin can override.
2. **All amounts in kobo.** Displayed in naira but stored and calculated as kobo integers.
3. **Only confirmed transactions count toward progress.** Pending and failed are excluded from savings total.
4. **Covenant must be signed before member status becomes active.** Members who skip onboarding cannot access the dashboard.
5. **Member completion is automatic.** When confirmed payments reach the plot target, a DB trigger sets status to `completed` and creates a certificate row.
6. **Non-refundable.** Stated in covenant. No refund flow exists in V1.
7. **Transfer narration must be the member's name.** Used by admin to match payments to members manually in V1.

---

## 14. Integrations

### GLM Members DB (Supabase — separate project)
- **Bridge endpoint:** `check-member` Edge Function
- **Purpose:** Validate that an email belongs to an active, eligible GLM member before granting Dawrash access
- **Protocol:** POST with `x-members-bridge-secret` header
- **Response:** `{ allowed, member_id, full_name }`
- **No shared DB access** — only the bridge endpoint is called

### Supabase (Dawrash project)
- Auth: OTP magic link (passwordless)
- Database: PostgreSQL with RLS
- SSO entry: `/auth/glm` verifies GLM JWT using shared secret

---

## 15. Security

- **RLS enabled** on all tables. Members can only read their own rows.
- **Service role key** never exposed to the browser. Used only in server actions and route handlers.
- **Bridge secret** is a shared secret stored as an environment variable. Rotatable without code changes.
- **Magic links expire** in 10 minutes.
- **Covenant acceptance** is timestamped server-side and stored permanently.
- **`NEXT_PUBLIC_`** variables only contain non-sensitive config (URL, anon key).

---

## 16. Environment Variables

| Variable | Where used | Sensitive |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes |
| `SUPABASE_JWT_SECRET` | `/auth/glm` route | Yes |
| `MEMBERS_BRIDGE_URL` | `lib/bridge.ts` | No |
| `MEMBERS_BRIDGE_SECRET` | `lib/bridge.ts` | Yes |
| `MEMBERS_BRIDGE_ANON_KEY` | `lib/bridge.ts` | Yes |
| `NEXT_PUBLIC_SITE_URL` | Auth redirects | No |

---

## 17. Routes

| Route | Type | Access |
|---|---|---|
| `/` | Static | Public |
| `/register` | Static | Public |
| `/login` | Static | Public |
| `/verify` | Static | Public |
| `/auth/callback` | Dynamic | Public (token required) |
| `/auth/glm` | Dynamic | Public (JWT required) |
| `/onboarding/plots` | Static | Authenticated |
| `/onboarding/covenant` | Static | Authenticated |
| `/dashboard` | Static | Authenticated member |
| `/transactions` | Static | Authenticated member |
| `/profile` | Static | Authenticated member |
| `/admin` | Static | Admin only |

---

## 18. Roadmap

### V1 (current)
- SSO from GLM Members app
- Plot selection + covenant signing
- Member dashboard with savings progress
- Manual payment recording by admin
- Admin panel: members, certificates, audit flags

### V2
- Paystack virtual account per member (automatic payment matching)
- Email notifications: payment confirmed, milestone reached, certificate issued
- Admin: bulk transaction import from bank statement CSV
- Member: plot transfer request flow

### V3
- Land certificate PDF generation and delivery
- Member referral tracking
- Multi-project support (beyond Dawrash City)
- Mobile push notifications
