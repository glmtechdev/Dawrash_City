'use client'

import { useState } from 'react'
import { PaymentBadge } from '@/components/dawrash/status-badge'
import { Badge } from '@/components/ui/badge'
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
import { Calendar, Receipt } from 'lucide-react'

type Filter = 'all' | 'confirmed' | 'pending'

const tabs: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function TransactionsContent({ member }: { member: Member }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [amount, setAmount] = useState<string>('')
  const [loadingPay, setLoadingPay] = useState(false)
  const [installments, setInstallments] = useState<number>(1)

  const target = targetKobo(member)
  const percent = progressPercent(member)
  const feePercent = Number(process.env.NEXT_PUBLIC_PAYSTACK_FEE_PERCENT ?? '0.015')
  const fixedFeeKobo = Number(process.env.NEXT_PUBLIC_PAYSTACK_FIXED_FEE_KOBO ?? '10000')
  const targetInclFees = target + Math.round(target * feePercent) + fixedFeeKobo

  function calcFeeForKobo(aKobo: number) {
    return Math.round(aKobo * feePercent) + fixedFeeKobo
  }

  const installmentProjection = (() => {
    const naira = Number(amount)
    if (!naira || naira <= 0 || installments < 1) return null
    const totalIntendedKobo = Math.round(naira * 100) * installments
    const perInstallKobo = Math.round(naira * 100)
    const perFee = calcFeeForKobo(perInstallKobo)
    const totalFees = perFee * installments
    const totalCharged = totalIntendedKobo + totalFees
    return { perInstallKobo, perFee, totalFees, totalCharged, totalIntendedKobo }
  })()

  const all = [...member.transactions].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  )
  const list = all.filter((t) =>
    filter === 'all' ? true : t.status === (filter as PaymentStatus),
  )

  const confirmedTotal = all
    .filter((t) => t.status === 'confirmed')
    .reduce((s, t) => s + t.amountKobo, 0)
  const pendingTotal = all
    .filter((t) => t.status === 'pending')
    .reduce((s, t) => s + t.amountKobo, 0)

  return (
    <div>
      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-semibold text-foreground">Make a payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">Quickly contribute toward your target using Paystack. You pay any transaction fees.</p>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (NGN)"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground"
          />
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-col gap-1">
              <div className="text-sm text-muted-foreground">
                <span className="mr-2">Fee: </span>
                <strong>
                  {amount && Number(amount) > 0
                    ? formatNaira(calcFeeForKobo(Math.round(Number(amount) * 100)))
                    : '-'}
                </strong>
                <span className="ml-2 text-xs">(per payment, estimated)</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="mr-2">Total charged (single): </span>
                <strong>
                  {amount && Number(amount) > 0
                    ? formatNaira(Math.round(Number(amount) * 100) + calcFeeForKobo(Math.round(Number(amount) * 100)))
                    : '-'}
                </strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const naira = Number(amount)
              if (!naira || naira <= 0) return toast.error('Enter a valid amount')
              setLoadingPay(true)
              try {
                const amountKobo = Math.round(naira * 100)

                // Fee settings (NEXT_PUBLIC inlined)
                const feePercent = Number(process.env.NEXT_PUBLIC_PAYSTACK_FEE_PERCENT ?? '0.015')
                const fixedFeeKobo = Number(process.env.NEXT_PUBLIC_PAYSTACK_FIXED_FEE_KOBO ?? '10000')

                const feeKobo = Math.round(amountKobo * feePercent) + fixedFeeKobo
                const totalChargeKobo = amountKobo + feeKobo

                const res = await fetch('/api/paystack/initiate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ amountKobo: totalChargeKobo, intendedAmountKobo: amountKobo }),
                })
                const data = await res.json()
                if (!res.ok) {
                  console.error('[pay] initiate error', data)
                  toast.error(data?.error || 'Could not start payment')
                  setLoadingPay(false)
                  return
                }

                const auth = data?.data?.data || data?.data
                const reference = auth?.reference || auth?.data?.reference || auth?.reference_no || null
                // Load Paystack inline script if needed
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

                  const pk = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
                  if (!(window as any).PaystackPop) {
                    toast.error('Paystack not available')
                    setLoadingPay(false)
                    return
                  }

                  const handler = (window as any).PaystackPop.setup({
                    key: pk,
                    email: member.email,
                    amount: totalChargeKobo,
                    ref: reference || `dawrash-${Date.now()}`,
                    onClose: () => {
                      toast('Payment closed')
                    },
                    callback: function (resp: any) {
                      // resp contains reference and status; server webhook will reconcile.
                      toast.success('Payment complete - awaiting confirmation')
                      // Optionally refresh or navigate to transactions
                      window.location.reload()
                    },
                  })

                  handler.openIframe()
                }
              } catch (err) {
                console.error('[pay] unexpected', err)
                toast.error('Payment initiation failed')
              } finally {
                setLoadingPay(false)
              }
            }}
            disabled={loadingPay}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-gold px-4 py-2 text-sm font-semibold text-gold-foreground disabled:opacity-60"
          >
            {loadingPay ? 'Processing…' : 'Pay with Paystack'}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Installments (equal)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={installments}
              onChange={(e) => setInstallments(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-32 rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <div>Projection:</div>
            {installmentProjection ? (
              <div className="mt-1">
                <div>Per payment (net): {formatNaira(installmentProjection.perInstallKobo)}</div>
                <div>Per fee (est): {formatNaira(installmentProjection.perFee)}</div>
                <div>Total fees: {formatNaira(installmentProjection.totalFees)}</div>
                <div className="font-semibold">Total charged: {formatNaira(installmentProjection.totalCharged)}</div>
              </div>
            ) : (
              <div className="mt-1">Enter amount and installments to see projection.</div>
            )}
          </div>
        </div>
      </div>
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
          Payment History
        </h1>
        <p className="mt-1 text-muted-foreground">
          Every transfer recorded toward your Dawrash City land.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total Saved
          </p>
          <p className="mt-1 font-serif text-sm font-bold text-success break-all">
            {formatNaira(confirmedTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pending
          </p>
          <p className="mt-1 font-serif text-sm font-bold text-warning break-all">
            {pendingTotal > 0 ? formatNaira(pendingTotal) : '-'}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Progress
          </p>
          <p className="mt-1 font-serif text-sm font-bold text-gold">
            {percent}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            of {formatNaira(target)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            If paid in one payment (incl. est. Paystack fees): {formatNaira(targetInclFees)}
          </p>
        </div>
      </div>

      <div className="mt-4 h-4 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gold transition-all"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1">
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
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                filter === t.value
                  ? 'bg-gold text-gold-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              {count > 0 && t.value !== 'all' && (
                <span
                  className={cn(
                    'ml-1.5 inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold',
                    filter === t.value
                      ? 'bg-white/25 text-gold-foreground'
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

      {list.length === 0 ? (
        <Empty className="mt-6 rounded-3xl border border-border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-accent text-gold">
              <Receipt />
            </EmptyMedia>
            <EmptyTitle className="font-serif text-lg font-bold">No payments yet</EmptyTitle>
            <EmptyDescription>
                {filter === 'all'
                  ? 'Make your first payment via Paystack to get started.'
                  : `No ${filter} payments found.`}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {list.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl',
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
                        className="rounded-full text-xs font-normal text-muted-foreground"
                      >
                        {t.method}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{t.reference}</span>
                    </div>
                </div>
              </div>
                <div className="flex flex-col items-end gap-1.5">
                <p
                  className={cn(
                    'font-bold',
                    t.status === 'confirmed'
                      ? 'text-success'
                      : t.status === 'failed'
                        ? 'text-destructive line-through opacity-60'
                        : 'text-foreground',
                  )}
                >
                  {formatNaira(t.amountKobo)}
                </p>
                  {t.method === 'Paystack' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Fee est: {formatNaira(calcFeeForKobo(t.amountKobo))} · Charged: {formatNaira(t.amountKobo + calcFeeForKobo(t.amountKobo))}
                    </p>
                  )}
                <PaymentBadge status={t.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
