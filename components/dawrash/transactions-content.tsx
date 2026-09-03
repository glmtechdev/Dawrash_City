'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PaymentBadge } from '@/components/dawrash/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import {
  formatNaira,
  targetKobo,
  progressPercent,
  type PaymentStatus,
  type Member,
} from '@/lib/dawrash-data'
import { toast } from 'sonner'
import {
  Calendar,
  Receipt,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Calculator,
  ChevronDown,
  ChevronUp,
  X,
  Construction,
} from 'lucide-react'

type Filter = 'all' | 'confirmed' | 'pending'

const tabs: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All Payments' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function TransactionsContent({ member }: { member: Member }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [amount, setAmount] = useState<string>('')
  const [loadingPay, setLoadingPay] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [installments, setInstallments] = useState<number>(3)
  const [paymentBanner, setPaymentBanner] = useState<'success' | 'failed' | 'cancelled' | null>(null)

  // Read ?payment= param on mount and show the appropriate banner
  useEffect(() => {
    const status = searchParams.get('payment')
    if (status === 'success' || status === 'failed' || status === 'cancelled') {
      setPaymentBanner(status)
      // Clean the URL without triggering a reload
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      router.replace(url.pathname + (url.search || ''), { scroll: false })
    }
  }, [searchParams, router])

  const target = targetKobo(member)
  const percent = progressPercent(member)
  const feePercent = Number(process.env.NEXT_PUBLIC_PAYSTACK_FEE_PERCENT ?? '0.015')
  const fixedFeeKobo = Number(process.env.NEXT_PUBLIC_PAYSTACK_FIXED_FEE_KOBO ?? '10000')

  function calcFeeForKobo(aKobo: number) {
    return Math.round(aKobo * feePercent) + fixedFeeKobo
  }

  const numericAmount = Number(amount) || 0
  const intendedAmountKobo = Math.round(numericAmount * 100)
  const feeKobo = intendedAmountKobo > 0 ? calcFeeForKobo(intendedAmountKobo) : 0
  const totalChargeKobo = intendedAmountKobo + feeKobo

  const all = [...member.transactions].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  )
  const list = all.filter((t) =>
    filter === 'all' ? true : t.status === (filter as PaymentStatus),
  )

  const confirmedTransactions = all.filter((t) => t.status === 'confirmed')
  const pendingTransactions = all.filter((t) => t.status === 'pending')

  const confirmedTotal = confirmedTransactions.reduce((s, t) => s + t.amountKobo, 0)
  const pendingTotal = pendingTransactions.reduce((s, t) => s + t.amountKobo, 0)
  const remainingTargetKobo = Math.max(0, target - confirmedTotal)



  const installmentProjection = (() => {
    if (!numericAmount || numericAmount <= 0 || installments < 1) return null
    const perInstallKobo = Math.round(intendedAmountKobo / installments)
    const perFee = calcFeeForKobo(perInstallKobo)
    const totalFees = perFee * installments
    const totalCharged = intendedAmountKobo + totalFees
    return { perInstallKobo, perFee, totalFees, totalCharged }
  })()

  async function handlePaystackCheckout() {
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoadingPay(true)
    try {
      const res = await fetch('/api/paystack/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountKobo: totalChargeKobo,
          intendedAmountKobo,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Could not initiate payment')
        setLoadingPay(false)
        return
      }

      const auth = data?.data?.data || data?.data
      const reference = auth?.reference || auth?.data?.reference || auth?.reference_no || null

      if (typeof window !== 'undefined') {
        if (!(window as any).PaystackPop) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://js.paystack.co/v1/inline.js'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Paystack script failed to load'))
            document.head.appendChild(script)
          })
        }

        const pk = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
        if (!(window as any).PaystackPop) {
          toast.error('Paystack SDK unavailable')
          setLoadingPay(false)
          return
        }

        const handler = (window as any).PaystackPop.setup({
          key: pk,
          email: member.email,
          amount: totalChargeKobo,
          ref: reference || `dawrash-${Date.now()}`,
          onClose: () => {
            toast('Payment cancelled')
            setLoadingPay(false)
            window.location.href = '/transactions?payment=cancelled'
          },
          callback: function () {
            window.location.href = '/transactions?payment=success'
          },
        })

        handler.openIframe()
      }
    } catch (err) {
      console.error('[pay] error', err)
      toast.error('Payment initiation failed')
    } finally {
      setLoadingPay(false)
    }
  }

  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'

  return (
    <div className="space-y-8 pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 0. PAYMENT RESULT BANNER                                       */}
      {/* ------------------------------------------------------------- */}
      {paymentBanner === 'success' && (
        <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-4 text-success">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Payment received</p>
            <p className="text-sm opacity-80">
              Your contribution is being reconciled in the ledger. It will appear as confirmed once the
              webhook processes (usually within seconds).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaymentBanner(null)}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {paymentBanner === 'cancelled' && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-warning">
          <XCircle className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Payment cancelled</p>
            <p className="text-sm opacity-80">
              You closed the payment window. No charge was made. You can try again whenever you&apos;re ready.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaymentBanner(null)}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {paymentBanner === 'failed' && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <XCircle className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Payment failed</p>
            <p className="text-sm opacity-80">
              Something went wrong with your payment. No funds were deducted. Please try again or use a
              different payment method.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaymentBanner(null)}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* 1. MAKE A PAYMENT CARD                                        */}
      {/* ------------------------------------------------------------- */}
      {paymentsEnabled ? (
      <div className="overflow-hidden rounded-3xl border border-gold/20 bg-card shadow-sm">

        {/* Top strip: merchant identity bar (Paystack-style) */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <CreditCard className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Dawrash City Land Savings</p>
              <p className="text-[11px] text-muted-foreground">dawrashcity.com</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <ShieldCheck className="size-3.5 text-gold" />
            Secured by Paystack
          </div>
        </div>

        {/* Center: amount terminal */}
        <div className="px-5 pb-1 pt-6 sm:px-8">

          {/* Remaining balance anchor */}
          {remainingTargetKobo > 0 ? (
            <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
              <span className="font-bold text-foreground">{formatNaira(remainingTargetKobo)}</span> remaining to complete your target
            </p>
          ) : (
            <p className="mb-3 text-center text-xs font-semibold text-success">
              Target complete. Any contribution goes toward your next plot.
            </p>
          )}

          {/* Large amount input */}
          <div className="relative flex items-center justify-center">
            <span className="pointer-events-none absolute left-4 font-serif text-3xl font-bold text-muted-foreground/60 sm:text-4xl">
              ₦
            </span>
            <input
              type="number"
              min={500}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              aria-label="Contribution amount in naira"
              className="w-full rounded-2xl border border-border bg-background pl-12 pr-4 py-4 font-serif text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-gold/50 sm:text-4xl"
            />
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Card · USSD · Bank Transfer via Paystack
          </p>
        </div>

        {/* Fee breakdown — only appears when amount is entered */}
        {numericAmount > 0 && (
          <div className="mx-5 mt-4 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs sm:mx-8">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Plot savings credit</span>
              <span className="font-semibold text-foreground">{formatNaira(intendedAmountKobo)}</span>
            </div>
            <div className="flex justify-between border-t border-border/50 py-1">
              <span className="text-muted-foreground">Paystack processing fee</span>
              <span className="text-muted-foreground">{formatNaira(feeKobo)}</span>
            </div>
            <div className="flex justify-between border-t border-border py-1.5 text-sm font-bold">
              <span className="text-foreground">Total charged to you</span>
              <span className="font-serif text-base text-gold">{formatNaira(totalChargeKobo)}</span>
            </div>
          </div>
        )}

        {/* Installment calculator */}
        <div className="mx-5 mt-3 rounded-2xl border border-border/70 bg-card p-3.5 sm:mx-8">
          <button
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            className="flex w-full items-center justify-between text-xs font-semibold text-foreground hover:text-gold"
          >
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-gold" />
              <span>Installment breakdown calculator</span>
            </div>
            {showCalculator ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showCalculator && (
            <div className="mt-3.5 space-y-3 border-t border-border pt-3">
              <div className="flex items-center gap-3">
                <span className="whitespace-nowrap text-xs text-muted-foreground">Installments:</span>
                <div className="flex gap-1.5">
                  {[2, 3, 6, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setInstallments(num)}
                      className={cn(
                        'size-8 rounded-full text-xs font-bold transition-colors',
                        installments === num
                          ? 'bg-gold text-gold-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {installmentProjection ? (
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Per payment</p>
                    <p className="font-semibold text-foreground">{formatNaira(installmentProjection.perInstallKobo)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fee / payment</p>
                    <p className="font-semibold text-foreground">{formatNaira(installmentProjection.perFee)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total fees</p>
                    <p className="font-semibold text-foreground">{formatNaira(installmentProjection.totalFees)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total charged</p>
                    <p className="font-bold text-gold">{formatNaira(installmentProjection.totalCharged)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Enter an amount above to see the breakdown.</p>
              )}
            </div>
          )}
        </div>

        {/* CTA button — navy background, gold text, high contrast */}
        <div className="px-5 pb-6 pt-4 sm:px-8">
          <Button
            type="button"
            disabled={loadingPay || numericAmount <= 0}
            onClick={handlePaystackCheckout}
            className="h-13 w-full rounded-2xl bg-navy text-base font-bold text-white hover:bg-navy/90 shadow-md transition-transform active:scale-[0.99] disabled:opacity-40"
          >
            <Lock className="mr-2 size-4" />
            {loadingPay ? (
              'Opening Paystack…'
            ) : numericAmount > 0 ? (
              `Pay ${formatNaira(totalChargeKobo)}`
            ) : (
              'Enter an amount to continue'
            )}
          </Button>
          <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
            You will not be charged until you confirm in the Paystack window.
          </p>
        </div>
      </div>
      ) : (
        /* Payments disabled notice */
        <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Construction className="size-6" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-foreground">Payments not open yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Online payments are not available at this stage. You will be notified when the payment window opens. Check back soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. PAYMENT HISTORY & SUMMARY METRICS                          */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Payment History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track all automated Paystack contributions and manual church bank transfers.
          </p>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Saved */}
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Saved
              </span>
              <span className="flex size-7 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="font-serif text-2xl font-bold text-success">
                {formatNaira(confirmedTotal)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {confirmedTransactions.length} confirmed payment{confirmedTransactions.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* Pending Verification */}
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending Verification
              </span>
              <span className="flex size-7 items-center justify-center rounded-full bg-warning/10 text-warning">
                <Clock className="size-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="font-serif text-2xl font-bold text-warning">
                {pendingTotal > 0 ? formatNaira(pendingTotal) : '₦0'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {pendingTransactions.length > 0
                  ? `${pendingTransactions.length} awaiting confirmation`
                  : 'All transactions settled'}
              </p>
            </div>
          </div>

          {/* Savings Progress */}
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Plot Progress
              </span>
              <span className="flex size-7 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Target className="size-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <p className="font-serif text-2xl font-bold text-gold">{percent}%</p>
                <span className="text-xs font-semibold text-muted-foreground">
                  of {formatNaira(target)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. TRANSACTION LIST & FILTERS                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {tabs.map((t) => {
              const count = all.filter((tx) =>
                t.value === 'all' ? true : tx.status === t.value,
              ).length
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFilter(t.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                    filter === t.value
                      ? 'bg-gold text-gold-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span>{t.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        'inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold',
                        filter === t.value
                          ? 'bg-black/20 text-gold-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {list.length === 0 ? (
          <Empty className="rounded-3xl border border-border bg-card py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-12 bg-accent text-gold">
                <Receipt className="size-6" />
              </EmptyMedia>
              <EmptyTitle className="font-serif text-lg font-bold">No payments found</EmptyTitle>
              <EmptyDescription>
                {filter === 'all'
                  ? 'Make your first plot contribution above to get started.'
                  : `No ${filter} payments found in your history.`}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-2xl',
                      t.status === 'confirmed'
                        ? 'bg-success/10 text-success'
                        : t.status === 'pending'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    <Calendar className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{formatDate(t.date)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-full text-[11px] font-medium border-border"
                      >
                        {t.method}
                      </Badge>
                      <span className="font-mono text-[11px] text-muted-foreground">{t.reference}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2 sm:border-t-0 sm:pt-0 sm:flex-col sm:items-end sm:gap-1.5">
                  <p
                    className={cn(
                      'font-serif text-base font-bold',
                      t.status === 'confirmed'
                        ? 'text-success'
                        : t.status === 'failed'
                          ? 'text-destructive line-through opacity-60'
                          : 'text-foreground',
                    )}
                  >
                    {formatNaira(t.amountKobo)}
                  </p>
                  <PaymentBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
