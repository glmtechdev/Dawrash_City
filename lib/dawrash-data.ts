// All monetary values are stored as kobo integers (1 naira = 100 kobo)
// and formatted to naira only at display time.

/** Cost of one plot (personal or church) = ₦1,000,000 */
export const PRICE_PER_PLOT_KOBO = 1_000_000 * 100

/**
 * Every personal plot a member buys is paired with one church-building plot,
 * both funded by the member.  The member's actual payment per personal plot
 * is therefore PRICE_PER_PLOT_KOBO × CHURCH_PLOT_MULTIPLIER = ₦2,000,000.
 */
export const CHURCH_PLOT_MULTIPLIER = 2

/** Payment amount per personal plot (= member plot + church plot) in kobo */
export const PAYMENT_PER_PERSONAL_PLOT_KOBO = PRICE_PER_PLOT_KOBO * CHURCH_PLOT_MULTIPLIER

export const TOTAL_PROJECT_PLOTS = 2_500 // Total Dawrash City master survey plots
export const TOTAL_PROJECT_TARGET_KOBO = TOTAL_PROJECT_PLOTS * PRICE_PER_PLOT_KOBO

/**
 * Maximum personal plots per member. Every member starts at 1 (auto-assigned).
 * To hold 2 plots a member must complete payment for plot 1 and get an
 * "Apply for More" application approved by admin.
 */
export const MAX_PLOTS = 2

export function formatNaira(kobo: number): string {
  const naira = Math.round(kobo / 100)
  // Use a fixed locale + explicit options so SSR (Node) and the browser
  // always produce the same string and avoid a hydration mismatch.
  return `\u20A6${new Intl.NumberFormat('en-NG', { useGrouping: true }).format(naira)}`
}

export function plotLabel(count: number): string {
  return count === 1 ? '1 Plot' : `${count} Plots`
}

export type PaymentStatus = 'confirmed' | 'pending' | 'failed'

export type Transaction = {
  id: string
  date: string // ISO date
  amountKobo: number
  method: string
  status: PaymentStatus
  reference: string
}

export type MemberStatus = 'active' | 'completed' | 'pending_covenant'

export type Member = {
  id: string
  name: string
  email: string
  initials: string
  /** Personal plots target (1–MAX_PLOTS). Each personal plot is paired with one church plot. */
  plots: number
  memberSince: string
  covenantSignedAt: string | null
  nuban?: string | null
  bank?: string | null
  status: MemberStatus
  transactions: Transaction[]
}


export const COVENANT_TEXT = `DAWRASH CITY LAND SAVINGS COVENANT - Version 2.0

Nature of This Agreement
This is a voluntary land savings commitment made in good faith as a member of Gospel Labour Ministry for the Dawrash City vision. This agreement is legally binding upon digital acceptance and enforceable under applicable Nigerian law.

Payment Commitment
I agree to save toward the purchase of my selected plot(s) of land within Dawrash City at \u20A61,000,000 per plot. For every personal plot I purchase, I also fund one matching plot for the Gospel Labour Ministry church building project. My total payment commitment is therefore \u20A62,000,000 per personal plot selected. There is no fixed payment deadline, and I may contribute at my own pace.

Non-Refundable Policy
All funds contributed are strictly non-refundable under any circumstances once confirmed. This includes personal financial hardship, change of mind, relocation, or departure from the faith community.

Transfer of Slot
If I am unable to continue, my savings and reservation may be transferred to another verified registered member, subject to administrative approval. No cash payout will be made.

Land Allocation
Upon full payment completion, a land certificate will be processed and issued in my name for my personal plot(s). The matching church plots will be allocated to the Gospel Labour Ministry church building project. Specific plot numbers will be assigned in a future allocation process.

Bank Accounts and Gateway Fees
All payment processing fees are borne by me and are separate from my land target amount.

Acknowledgement
I confirm I am a registered member, I am of legal age and sound mind, and I accept this covenant freely and without coercion.`

// ---------------------------------------------------------------------------
// Derived computation helpers
// ---------------------------------------------------------------------------

/**
 * The total amount a member must pay to fully complete their target.
 * = personal plots × ₦1M (personal) + personal plots × ₦1M (church) = plots × ₦2M
 */
export function targetKobo(member: Pick<Member, 'plots'>): number {
  return member.plots * PAYMENT_PER_PERSONAL_PLOT_KOBO
}

/** Sum of all confirmed transaction amounts */
export function savedKobo(member: Pick<Member, 'transactions'>): number {
  return member.transactions
    .filter((t) => t.status === 'confirmed')
    .reduce((sum, t) => sum + t.amountKobo, 0)
}

export function progressPercent(member: Member): number {
  const target = targetKobo(member)
  if (target === 0) return 0
  return Math.min(100, Math.round((savedKobo(member) / target) * 100))
}

/**
 * How many personal plots the member has fully paid for.
 * A personal plot is fully paid when its paired payment (2 × PRICE_PER_PLOT_KOBO) is confirmed.
 */
export function plotsFullyPaid(member: Pick<Member, 'transactions'>): number {
  return Math.floor(savedKobo(member) / PAYMENT_PER_PERSONAL_PLOT_KOBO)
}

/**
 * Church plots funded by a member = their personal plots fully paid.
 * (1 church plot unlocked for every personal plot fully paid)
 */
export function churchPlotsContributed(member: Pick<Member, 'transactions'>): number {
  return plotsFullyPaid(member)
}

// ---------------------------------------------------------------------------
// Demo data - reflects the new N2M/personal-plot payment model
// ---------------------------------------------------------------------------

// Demo member: 1 personal plot, fully paid (N2,000,000 confirmed), status completed.
// This triggers the "Apply for More" button on the profile page in dev mode.
export const currentMember: Member = {
  id: 'mbr_001',
  name: 'Daniel Okafor',
  email: 'daniel.okafor@glm.org',
  initials: 'DO',
  plots: 1,
  memberSince: '2025-11-04',
  covenantSignedAt: '2025-11-06T14:22:00+01:00',
  nuban: '',
  bank: '',
  status: 'completed',
  transactions: [
    { id: 't1', date: '2026-06-01', amountKobo: 1_000_000 * 100, method: 'Paystack', status: 'confirmed', reference: 'DWR-8001' },
    { id: 't2', date: '2026-07-15', amountKobo: 1_000_000 * 100, method: 'Paystack', status: 'confirmed', reference: 'DWR-8002' },
    { id: 't3', date: '2026-08-25', amountKobo: 200_000 * 100, method: 'Paystack', status: 'pending', reference: 'DWR-8901' },
  ],
}

// Admin demo directory
export const members: Member[] = [
  currentMember,
  {
    id: 'mbr_002',
    name: 'Grace Adeyemi',
    email: 'grace.adeyemi@glm.org',
    initials: 'GA',
    plots: 2,
    memberSince: '2025-10-12',
    covenantSignedAt: '2025-10-14T09:10:00+01:00',
    nuban: '',
    bank: '',
    status: 'completed',
    // 2 personal plots × ₦2M = ₦4M total paid
    transactions: [
      { id: 'g1', date: '2026-08-01', amountKobo: 2_000_000 * 100, method: 'Paystack', status: 'confirmed', reference: 'DWR-8700' },
      { id: 'g2', date: '2026-06-01', amountKobo: 2_000_000 * 100, method: 'Paystack', status: 'confirmed', reference: 'DWR-8100' },
    ],
  },
  {
    id: 'mbr_003',
    name: 'Emmanuel Bello',
    email: 'emmanuel.bello@glm.org',
    initials: 'EB',
    plots: 1,
    memberSince: '2026-01-20',
    covenantSignedAt: '2026-01-22T16:40:00+01:00',
    nuban: '',
    bank: '',
    status: 'active',
    transactions: [
      { id: 'e1', date: '2026-08-10', amountKobo: 350_000 * 100, method: 'Paystack', status: 'confirmed', reference: 'DWR-8820' },
      { id: 'e2', date: '2026-07-11', amountKobo: 500_000 * 100, method: 'Paystack', status: 'confirmed', reference: 'DWR-8500' },
    ],
  },
  {
    id: 'mbr_004',
    name: 'Ruth Nwachukwu',
    email: 'ruth.nwachukwu@glm.org',
    initials: 'RN',
    plots: 2,
    memberSince: '2026-02-08',
    covenantSignedAt: null,
    nuban: '',
    bank: '',
    status: 'pending_covenant',
    transactions: [],
  },
  {
    id: 'mbr_005',
    name: 'Samuel Ogunleye',
    email: 'samuel.ogunleye@glm.org',
    initials: 'SO',
    plots: 3,
    memberSince: '2025-09-30',
    covenantSignedAt: '2025-10-01T11:05:00+01:00',
    nuban: '',
    bank: '',
    status: 'active',
    transactions: [
      { id: 's1', date: '2026-08-05', amountKobo: 1_200_000 * 100, method: 'Paystack', status: 'confirmed', reference: 'DWR-8750' },
      { id: 's2', date: '2026-06-20', amountKobo: 1_500_000 * 100, method: 'Paystack', status: 'confirmed', reference: 'DWR-8250' },
      { id: 's3', date: '2026-04-14', amountKobo: 900_000 * 100, method: 'Paystack', status: 'confirmed', reference: 'DWR-7600' },
    ],
  },
  {
    id: 'mbr_006',
    name: 'Deborah Eze',
    email: 'deborah.eze@glm.org',
    initials: 'DE',
    plots: 1,
    memberSince: '2025-12-15',
    covenantSignedAt: '2025-12-16T08:30:00+01:00',
    nuban: '',
    bank: '',
    status: 'completed',
    // 1 personal plot × ₦2M = ₦2M total paid
    transactions: [
      { id: 'd1', date: '2026-07-25', amountKobo: 2_000_000 * 100, method: 'Paystack', status: 'confirmed', reference: 'DWR-8680' },
    ],
  },
]

export const auditFlags = [
  {
    id: 'af1',
    member: 'Samuel Ogunleye',
    reference: 'DWR-8750',
    expectedKobo: 1_200_000 * 100,
    recordedKobo: 1_150_000 * 100,
    note: 'Transfer amount lower than logged pledge.',
  },
  {
    id: 'af2',
    member: 'Emmanuel Bello',
    reference: 'DWR-8500',
    expectedKobo: 500_000 * 100,
    recordedKobo: 520_000 * 100,
    note: 'Duplicate inflow detected against single reference.',
  },
]

export function statusLabel(status: MemberStatus): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'completed':
      return 'Completed'
    case 'pending_covenant':
      return 'Pending Covenant'
  }
}
