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

  const target = targetKobo(member)
  const percent = progressPercent(member)

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
            {pendingTotal > 0 ? formatNaira(pendingTotal) : '—'}
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
                ? 'Make your first bank transfer to get started.'
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
                <PaymentBadge status={t.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
