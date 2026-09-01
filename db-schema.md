Getting your database table list with column details.
## Your tables (row counts) + columns

### `public.profiles` - **48 rows**
Columns:
- `id` (uuid, PK)
- `full_name` (text)
- `email` (text, unique)
- `initials` (text, default `''`)
- `glm_member_id` (uuid, nullable, unique)
- `plots` (smallint, default `0`)
- `status` (enum: `pending_covenant | active | completed`)
- `onboarding_complete` (boolean, default `false`)
- `member_since` (date, default `CURRENT_DATE`)
- `covenant_signed_at` (timestamptz, nullable)
- `created_at` (timestamptz, default `now()`)
- `updated_at` (timestamptz, default `now()`)
- `is_admin` (boolean, default `false`)
- `is_superadmin` (boolean, default `false`)

---

### `public.transactions` - **0 rows**
Columns:
- `id` (uuid, PK)
- `member_id` (uuid)
- `amount_kobo` (bigint, check `> 0`)
- `method` (text, default `'Bank Transfer'`)
- `status` (enum: `pending | confirmed | failed`)
- `reference` (text, unique)
- `paid_at` (date, default `CURRENT_DATE`)
- `notes` (text, nullable)
- `created_at` (timestamptz, default `now()`)
- `updated_at` (timestamptz, default `now()`)
- `fee_kobo` (bigint, nullable)
- `charged_amount_kobo` (bigint, nullable)
- `intended_amount_kobo` (bigint, nullable)

---

### `public.audit_flags` - **0 rows**
Columns:
- `id` (uuid, PK)
- `transaction_id` (uuid)
- `member_id` (uuid)
- `reference` (text)
- `expected_kobo` (bigint)
- `recorded_kobo` (bigint)
- `variance_kobo` (generated bigint, default `(recorded_kobo - expected_kobo)`)
- `note` (text)
- `resolved` (boolean, default `false`)
- `resolved_at` (timestamptz, nullable)
- `created_at` (timestamptz, default `now()`)

---

### `public.certificates` - **0 rows**
Columns:
- `id` (uuid, PK)
- `member_id` (uuid, unique)
- `plot_numbers` (text, nullable)
- `issued_at` (timestamptz, nullable)
- `delivered` (boolean, default `false`)
- `delivered_at` (timestamptz, nullable)
- `created_at` (timestamptz, default `now()`)