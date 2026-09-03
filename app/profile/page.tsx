import Link from 'next/link'
import { MemberLayout } from '@/components/dawrash/member-layout'
import { ApplyForMoreDialog } from '@/components/dawrash/apply-for-more-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getCurrentMemberServer } from '@/lib/member-data'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  plotLabel,
  progressPercent,
  savedKobo,
  targetKobo,
  formatNaira,
  COVENANT_TEXT,
  churchPlotsContributed,
} from '@/lib/dawrash-data'
import {
  CircleCheck,
  LandPlot,
  LogOut,
  Mail,
  CalendarDays,
  TrendingUp,
  ScrollText,
  CheckCircle2,
  Clock,
} from 'lucide-react'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const member = await getCurrentMemberServer()

  const saved = savedKobo(member)
  const target = targetKobo(member)
  const percent = progressPercent(member)
  const churchDone = churchPlotsContributed(member)

  // Check for a pending "Apply for More" application
  let hasPendingApplication = false
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: pending } = await supabase
        .from('target_increase_requests')
        .select('id')
        .eq('member_id', user.id)
        .eq('status', 'pending')
        .maybeSingle()
      hasPendingApplication = Boolean(pending)
    }
  } catch {
    // Non-fatal - fall through with hasPendingApplication = false
  }

  // "Apply for More" is shown only to completed members with no pending application
  // and who don't already hold 2 plots
  const canApplyForMore =
    member.status === 'completed' &&
    member.plots < 2 &&
    !hasPendingApplication

  return (
    <MemberLayout>
      <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Profile</h1>

      {/* Identity card */}
      <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar className="size-20 shrink-0 border-2 border-gold/30">
            <AvatarFallback className="bg-accent font-serif text-2xl font-bold text-gold">
              {member.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-bold text-foreground">{member.name}</h2>
            <p className="mt-1 flex items-center justify-center gap-2 text-muted-foreground sm:justify-start">
              <Mail className="size-4 shrink-0" aria-hidden />
              {member.email}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge className="rounded-full border-transparent bg-gold/12 px-3 py-1 text-gold">
                <LandPlot className="size-3.5" data-icon="inline-start" />
                {plotLabel(member.plots)}
              </Badge>
              <Badge
                className={
                  member.status === 'completed'
                    ? 'rounded-full border-transparent bg-success/12 px-3 py-1 text-success'
                    : member.status === 'active'
                      ? 'rounded-full border-transparent bg-gold/12 px-3 py-1 text-gold'
                      : 'rounded-full border-transparent bg-warning/15 px-3 py-1 text-warning'
                }
              >
                {member.status === 'active'
                  ? 'Active'
                  : member.status === 'completed'
                    ? 'Completed'
                    : 'Pending Covenant'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden />
              Member since
            </dt>
            <dd className="mt-1 font-semibold text-foreground">
              {formatDate(member.memberSince)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <CircleCheck className="size-4" aria-hidden />
              Covenant status
            </dt>
            <dd className="mt-1 flex items-center gap-2 font-semibold">
              {member.covenantSignedAt ? (
                <>
                  <span className="text-success">Signed</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    on {formatDate(member.covenantSignedAt)}
                  </span>
                </>
              ) : (
                <span className="text-warning">Not signed</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Savings snapshot */}
      <section className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-gold" aria-hidden />
            <h2 className="font-serif text-lg font-bold text-foreground">Savings Snapshot</h2>
          </div>

          {/* Apply for More button */}
          {canApplyForMore && (
            <ApplyForMoreDialog memberName={member.name} />
          )}

          {/* Pending application notice */}
          {hasPendingApplication && member.plots < 2 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
              <Clock className="size-3.5" />
              Application Pending
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Saved
            </p>
            <p className="mt-1 font-serif text-sm font-bold text-success break-all">{formatNaira(saved)}</p>
          </div>
          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Target
            </p>
            <p className="mt-1 font-serif text-sm font-bold text-foreground break-all">
              {formatNaira(target)}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Progress
            </p>
            <p className="mt-1 font-serif text-sm font-bold text-gold">{percent}%</p>
          </div>
        </div>

        {/* Church contribution note */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{plotLabel(member.plots)} personal</span>
          <span>·</span>
          <span>{plotLabel(member.plots)} church (funded by you)</span>
          {churchDone > 0 && (
            <>
              <span>·</span>
              <span className="text-success font-semibold">
                {churchDone} church plot{churchDone > 1 ? 's' : ''} fully funded
              </span>
            </>
          )}
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

        {/* Contextual guidance based on status */}
        {member.status === 'active' && member.plots < 2 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Complete full payment of {formatNaira(target)} to unlock the option to apply for a second plot.
          </p>
        )}
        {member.status === 'completed' && member.plots >= 2 && (
          <p className="mt-3 text-xs text-success font-medium">
            You hold the maximum of 2 personal plots. Your land certificates will be processed after allocation.
          </p>
        )}
      </section>

      {/* Signed Covenant Document */}
      <section className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="size-5 text-gold" aria-hidden />
            <h2 className="font-serif text-lg font-bold text-foreground">Land Savings Covenant</h2>
          </div>
          {member.covenantSignedAt && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <CheckCircle2 className="size-3.5" />
              <span>Signed digitally on {formatDate(member.covenantSignedAt)}</span>
            </div>
          )}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          {member.covenantSignedAt
            ? 'Below is the full text of your digitally executed Dawrash City Land Savings Covenant agreement.'
            : 'You have not yet signed the Dawrash City Land Savings Covenant.'}
        </p>

        {member.covenantSignedAt ? (
          <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-border bg-muted/40 p-4 text-xs font-mono leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {COVENANT_TEXT}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Complete and sign your covenant to activate your plot reservation.
            </p>
            <Button
              render={<Link href="/onboarding/covenant" />}
              className="mt-3 rounded-full bg-gold text-forest font-semibold hover:bg-gold-light"
            >
              Review &amp; Sign Covenant
            </Button>
          </div>
        )}
      </section>

      {/* Settings */}
      <section className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your session on this device.</p>
        <Button
          render={<Link href="/" />}
          variant="outline"
          className="mt-4 rounded-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          <LogOut data-icon="inline-start" />
          Sign Out
        </Button>
      </section>
    </MemberLayout>
  )
}
