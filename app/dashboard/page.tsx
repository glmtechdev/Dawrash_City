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
  plotLabel,
  savedKobo,
  targetKobo,
  progressPercent,
  PRICE_PER_PLOT_KOBO,
} from '@/lib/dawrash-data'
import {
  Building2,
  ArrowRight,
  TrendingUp,
  LandPlot,
  CalendarDays,
  ScrollText,
  Sparkles,
} from 'lucide-react'

const milestones = [25, 50, 75, 100]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function MilestoneLabel({ milestone, percent }: { milestone: number; percent: number }) {
  const reached = percent >= milestone
  const isNext = !reached && milestones.find((m) => percent < m) === milestone
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          'flex size-9 items-center justify-center rounded-full text-xs font-bold transition-colors',
          reached
            ? 'bg-gold text-gold-foreground'
            : isNext
              ? 'border-2 border-gold/40 bg-gold/10 text-gold'
              : 'bg-white/10 text-secondary-foreground/50',
        )}
      >
        {milestone}%
      </div>
      <div
        className={cn(
          'h-0.5 w-full rounded-full transition-colors',
          reached ? 'bg-gold' : 'bg-white/15',
        )}
      />
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {

  const member = await getCurrentMemberServer()

  const saved = savedKobo(member)
  const target = targetKobo(member)
  const remaining = Math.max(0, target - saved)
  const percent = progressPercent(member)
  const plotsDone = Math.floor(saved / PRICE_PER_PLOT_KOBO)
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
              <h2 className="font-serif text-lg font-bold text-foreground">Complete Your Land Onboarding</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Select your land plot count and accept the Dawrash Covenant to lock in your reservation.
              </p>
            </div>
          </div>
          <Button
            render={<Link href="/onboarding/plots" />}
            size="lg"
            className="mt-4 w-full rounded-full bg-gold text-sm font-semibold text-gold-foreground hover:bg-gold/90 sm:w-auto sm:px-6"
          >
            Start Onboarding
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
      )}

      {/* ── Savings summary card ── */}
      <section
        aria-label="Land savings summary"
        className="mt-5 overflow-hidden rounded-3xl bg-secondary p-6 text-secondary-foreground shadow-md sm:p-8"
      >
        {/* Top row: text + ring */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: numbers */}
          <div className="order-2 w-full text-center sm:order-1 sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              Your Land Target
            </p>
            <p className="mt-2 font-serif text-2xl font-bold leading-tight">
              {plotLabel(member.plots)} in Dawrash City
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/8 p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-secondary-foreground/60">
                  Saved
                </p>
                <p className="mt-1 font-serif text-lg font-bold text-gold">{formatNaira(saved)}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-secondary-foreground/60">
                  Remaining
                </p>
                <p className="mt-1 font-serif text-lg font-bold">{formatNaira(remaining)}</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-white/8 p-3.5 sm:col-span-1">
                <p className="text-[11px] uppercase tracking-wide text-secondary-foreground/60">
                  Target
                </p>
                <p className="mt-1 font-serif text-lg font-bold">{formatNaira(target)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-secondary-foreground/70">
              <span className="flex items-center gap-1.5">
                <LandPlot className="size-3.5 text-gold" aria-hidden />
                {plotsDone > 0 ? `${plotsDone} plot${plotsDone > 1 ? 's' : ''} fully paid` : 'No plots fully paid yet'}
              </span>
              {plotsRemaining > 0 && (
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-gold" aria-hidden />
                  {plotsRemaining} plot{plotsRemaining > 1 ? 's' : ''} remaining
                </span>
              )}
            </div>
          </div>

          {/* Right: progress ring */}
          <div className="order-1 shrink-0 sm:order-2">
            <ProgressRing
              percent={percent}
              size={152}
              stroke={14}
              trackClassName="text-white/15"
              barClassName="text-gold"
            >
              <span className="font-serif text-4xl font-bold text-gold">{percent}%</span>
              <span className="text-[10px] uppercase tracking-widest text-secondary-foreground/55">
                Saved
              </span>
            </ProgressRing>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-4 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gold transition-all duration-500"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${percent}% saved`}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {milestones.map((m) => (
            <MilestoneLabel key={m} milestone={m} percent={percent} />
          ))}
        </div>
      </section>

      {/* ── Quick stats row ── */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4 text-gold" aria-hidden />
            Member since
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
        <div className="col-span-2 rounded-2xl border border-border bg-card p-4 shadow-sm sm:col-span-1">
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

      {/* ── Payment account ── */}
      <section
        aria-label="Payment account details"
        className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-gold">
            <Building2 className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground">Payment Account</h2>
            <p className="text-sm text-muted-foreground">
              Transfer to this account from any bank to log your payment.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Bank
              </p>
              <p className="mt-1 font-semibold text-foreground">{member.bank}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Account name
              </p>
              <p className="mt-1 font-semibold text-foreground">DAWRASH / {member.name}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Account number
              </p>
              <div className="mt-1 flex items-center gap-3">
                <p className="font-mono text-xl font-bold tracking-widest text-foreground">
                  {member.nuban}
                </p>
                <CopyButton value={member.nuban} />
              </div>
            </div>
          </div>

          <p className="mt-4 rounded-xl bg-gold/8 px-4 py-2.5 text-sm text-gold">
            Use your name as the transfer narration so your payment is matched automatically.
          </p>
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
              Make a transfer to get started.
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
