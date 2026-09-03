import Link from 'next/link'
import { MemberLayout } from '@/components/dawrash/member-layout'
import { ProgressRing } from '@/components/dawrash/progress-ring'
import { CopyButton } from '@/components/dawrash/copy-button'
import { PaymentBadge } from '@/components/dawrash/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCurrentMemberServer } from '@/lib/member-data'
import {
  formatNaira,
  savedKobo,
  targetKobo,
  progressPercent,
  plotsFullyPaid,
  churchPlotsContributed,
  PAYMENT_PER_PERSONAL_PLOT_KOBO,
} from '@/lib/dawrash-data'
import {
  Building2,
  ArrowRight,
  TrendingUp,
  LandPlot,
  Church,
  CalendarDays,
  ScrollText,
  Sparkles,
  Lock,
} from 'lucide-react'

const milestones = [25, 50, 75, 100]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {

  const member = await getCurrentMemberServer()

  const saved = savedKobo(member)
  const target = targetKobo(member)
  const remaining = Math.max(0, target - saved)
  const percent = progressPercent(member)
  const plotsDone = plotsFullyPaid(member)
  const churchPlotsDone = churchPlotsContributed(member)
  const plotsRemaining = member.plots - plotsDone

  const confirmedCount = member.transactions.filter((t) => t.status === 'confirmed').length
  const pendingCount = member.transactions.filter((t) => t.status === 'pending').length

  const recent = [...member.transactions]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 5)

  return (
    <MemberLayout>
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
            Welcome back, {member.name.split(' ')[0]} 👋
          </h1>
        </div>
        <Badge
          className={cn(
            'mt-1 rounded-full px-3 py-1 text-xs font-semibold',
            member.status === 'active'
              ? 'border-transparent bg-gold/12 text-gold'
              : member.status === 'completed'
                ? 'border-transparent bg-success/12 text-success'
                : 'border-transparent bg-warning/15 text-warning',
          )}
        >
          {member.status === 'active'
            ? 'Active'
            : member.status === 'completed'
              ? 'Completed'
              : 'Pending Covenant'}
        </Badge>
      </div>

      {/* ── Pending Onboarding Banner ── */}
      {(!member.covenantSignedAt || member.plots === 0) && (
        <div className="mt-5 rounded-3xl border border-gold/40 bg-gold/10 p-5 text-foreground shadow-sm">
          <div className="flex items-start gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gold text-gold-foreground">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-lg font-bold text-foreground">Activate Your Membership</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your first plot is reserved. Sign the Dawrash Covenant to activate your membership.
              </p>
            </div>
          </div>
          <Button
            render={<Link href="/onboarding/covenant" />}
            size="lg"
            className="mt-4 w-full rounded-full bg-gold text-sm font-semibold text-gold-foreground hover:bg-gold/90 sm:w-auto sm:px-6"
          >
            Review Covenant
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
      )}

      {/* ── Savings summary card ── */}
      <section
        aria-label="Land savings summary"
        className="mt-5 overflow-hidden rounded-3xl shadow-md"
        style={{ background: '#1a3050' }}
      >
        {/* Ring + headline */}
        <div className="flex flex-col items-center gap-5 px-6 pt-7 sm:flex-row sm:items-start sm:justify-between sm:px-8">

          {/* Left: target label + 2 stat boxes */}
          <div className="order-2 w-full text-center sm:order-1 sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#e5b85c' }}>
              Your Land Allocation
            </p>
            <p className="mt-1.5 font-serif text-2xl font-bold text-white leading-tight">
              {member.plots} personal plot{member.plots > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-white/50">
              Includes {member.plots} church-building plot{member.plots > 1 ? 's' : ''} · {formatNaira(PAYMENT_PER_PERSONAL_PLOT_KOBO * member.plots)} total
            </p>

            {/* 2 stat boxes — amount saved + balance */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <p className="text-[11px] uppercase tracking-wide text-white/50">Amount saved</p>
                <p className="mt-1 font-serif text-lg font-bold text-[#4ade80]">{formatNaira(saved)}</p>
              </div>
              <div className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <p className="text-[11px] uppercase tracking-wide text-white/50">Balance</p>
                <p className={cn(
                  'mt-1 font-serif text-lg font-bold',
                  remaining === 0 ? 'text-[#4ade80]' : 'text-[#f59e0b]'
                )}>
                  {remaining === 0 ? 'Fully funded' : formatNaira(remaining)}
                </p>
              </div>
            </div>
          </div>

          {/* Right: progress ring */}
          <div className="order-1 shrink-0 sm:order-2">
            <ProgressRing
              percent={percent}
              size={148}
              stroke={13}
              trackClassName="text-white/10"
              barClassName={percent >= 100 ? 'text-[#4ade80]' : percent >= 75 ? 'text-[#86efac]' : percent >= 50 ? 'text-[#fbbf24]' : 'text-[#f59e0b]'}
            >
              <span className={cn(
                'font-serif text-4xl font-bold',
                percent >= 75 ? 'text-[#4ade80]' : 'text-[#e5b85c]'
              )}>
                {percent}%
              </span>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(229,184,92,0.5)' }}>
                Funded
              </span>
            </ProgressRing>
          </div>
        </div>

        {/* Progress bar + ticks + footer line */}
        <div className="px-6 pb-6 pt-5 sm:px-8">
          {/* Bar — amber-to-green gradient fill */}
          <div className="relative h-2.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${percent}%`,
                background: percent >= 100
                  ? '#4ade80'
                  : `linear-gradient(to right, #f59e0b, ${percent >= 75 ? '#4ade80' : percent >= 50 ? '#86efac' : '#fbbf24'})`,
              }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${percent}% funded`}
            />
            {/* Tick notches */}
            {[25, 50, 75].map((tick) => (
              <span
                key={tick}
                className="absolute top-0 h-full w-px"
                style={{ left: `${tick}%`, background: 'rgba(255,255,255,0.15)' }}
                aria-hidden
              />
            ))}
          </div>

          {/* Tick labels */}
          <div className="relative mt-2 h-4">
            {milestones.map((m) => (
              <span
                key={m}
                className={cn(
                  'absolute -translate-x-1/2 text-[10px] font-semibold transition-colors',
                  percent >= m ? 'text-white/70' : 'text-white/25',
                )}
                style={{ left: `${m}%` }}
              >
                {m}%
              </span>
            ))}
          </div>

          {/* Footer: plots status line */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <LandPlot className="size-3.5" style={{ color: '#e5b85c' }} aria-hidden />
              {plotsDone > 0
                ? `${plotsDone} personal plot${plotsDone > 1 ? 's' : ''} fully paid`
                : 'No plots fully paid yet'}
            </span>
            {plotsRemaining > 0 && (
              <span className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5" style={{ color: '#e5b85c' }} aria-hidden />
                {plotsRemaining} plot{plotsRemaining > 1 ? 's' : ''} remaining
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Quick stats row ── */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4 text-gold" aria-hidden />
            Joined
          </div>
          <p className="mt-1.5 font-semibold text-foreground">{formatDate(member.memberSince)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4 text-gold" aria-hidden />
            Payments
          </div>
          <p className="mt-1.5 font-semibold text-foreground">
            {confirmedCount} confirmed
            {pendingCount > 0 && (
              <span className="ml-1.5 text-sm font-normal text-warning">
                · {pendingCount} pending
              </span>
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Church className="size-4 text-gold" aria-hidden />
            Church plots
          </div>
          <p className="mt-1.5 font-semibold text-foreground">
            {churchPlotsDone > 0 ? `${churchPlotsDone} funded` : 'None yet'}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ScrollText className="size-4 text-gold" aria-hidden />
            Covenant
          </div>
          <p className="mt-1.5 font-semibold">
            {member.covenantSignedAt ? (
              <span className="text-success">Signed</span>
            ) : (
              <span className="text-warning">Not signed</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Direct Savings Contribution ── */}
      <section
        aria-label="Make a contribution"
        className="mt-6 overflow-hidden rounded-3xl border border-gold/20 bg-card shadow-sm"
      >
        {/* Merchant identity bar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <Lock className="size-3.5 text-gold" aria-hidden />
            <p className="text-xs font-bold text-foreground">Dawrash City Land Savings</p>
          </div>
          <p className="text-[11px] font-semibold" style={{ color: '#00C3F7' }}>Secured by Paystack</p>
        </div>

        {/* Amount due + CTA */}
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            {remaining > 0 ? (
              <>
                <p className="text-xs font-medium text-muted-foreground">Continue your land savings</p>
                <p className="mt-0.5 font-serif text-lg font-bold text-foreground">
                  Add to your allocation
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-success">Target complete</p>
                <p className="mt-0.5 font-serif text-lg font-bold text-foreground">
                  All plots fully funded
                </p>
              </>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Card · USSD · Bank Transfer
            </p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1a3050' }}
          >
            <Lock className="size-4" aria-hidden />
            Make a Contribution
          </Link>
        </div>
      </section>

      {/* ── Recent payments ── */}
      <section
        aria-label="Recent payments"
        className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-foreground">Recent Payments</h2>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-sm font-semibold text-gold hover:underline"
          >
            View all
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Make a payment via Paystack or bank transfer to get started.
            </p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {recent.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-1"
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                      t.status === 'confirmed'
                        ? 'bg-success/10 text-success'
                        : t.status === 'pending'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {t.status === 'confirmed' ? '+' : t.status === 'pending' ? '~' : '!'}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{formatDate(t.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.method} &middot; {t.reference}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
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
      </section>
    </MemberLayout>
  )
}
