'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ProgressRing } from '@/components/dawrash/progress-ring'
import { MemberBadge, PaymentBadge } from '@/components/dawrash/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  formatNaira,
  plotLabel,
  savedKobo,
  targetKobo,
  type Member,
  type MemberStatus,
  PRICE_PER_PLOT_KOBO,
} from '@/lib/dawrash-data'
import {
  Users,
  Wallet,
  Target,
  TrendingUp,
  Search,
  CheckCircle2,
  Flag,
  ChevronRight,
  CalendarDays,
  ScrollText,
  LandPlot,
  AlertTriangle,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function percent(a: number, b: number) {
  if (b === 0) return 0
  return Math.min(100, Math.round((a / b) * 100))
}

function useIsClient() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted
}

/* ------------------------------------------------------------------ */
/*  Overview                                                            */
/* ------------------------------------------------------------------ */

export function OverviewSection({ members }: { members: Member[] }) {
  const isClient = useIsClient()
  const totalMembers = members.length
  const totalCollected = members.reduce((sum, m) => sum + savedKobo(m), 0)
  const totalTarget = members.reduce((sum, m) => sum + targetKobo(m), 0)
  const overall = percent(totalCollected, totalTarget)

  const byStatus: Record<MemberStatus, number> = {
    active: 0,
    completed: 0,
    pending_covenant: 0,
  }
  members.forEach((m) => { byStatus[m.status] += 1 })

  const chartData = members.map((m) => ({
    name: m.name.split(' ')[0],
    paid: Math.round(savedKobo(m) / 100_000) / 10,
    target: Math.round(targetKobo(m) / 100_000) / 10,
  }))

  const stats = [
    {
      icon: Users,
      label: 'Members',
      value: totalMembers.toString(),
      sub: `${byStatus.active} active`,
    },
    {
      icon: Wallet,
      label: 'Total Collected',
      value: formatNaira(totalCollected),
      sub: `${overall}% of goal`,
    },
    {
      icon: Target,
      label: 'Total Target',
      value: formatNaira(totalTarget),
      sub: `${members.reduce((s, m) => s + m.plots, 0)} plots reserved`,
    },
    {
      icon: TrendingUp,
      label: 'Completed',
      value: byStatus.completed.toString(),
      sub: 'fully paid',
    },
  ]

  return (
    <div>
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Overview</h1>
        <p className="mt-1 text-muted-foreground">
          Programme-wide savings across all Dawrash City members.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-gold">
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-4 text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 font-serif text-2xl font-bold text-foreground">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-foreground">Members by Status</h2>
          <div className="mt-5 flex flex-col gap-4">
            {(
              [
                { key: 'active' as MemberStatus,           label: 'Active',           cls: 'bg-gold' },
                { key: 'completed' as MemberStatus,        label: 'Completed',        cls: 'bg-success' },
                { key: 'pending_covenant' as MemberStatus, label: 'Pending Covenant', cls: 'bg-warning' },
              ] as const
            ).map((b) => (
              <div key={b.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{b.label}</span>
                  <span className="text-muted-foreground">
                    {byStatus[b.key]}{' '}
                    <span className="text-xs">({percent(byStatus[b.key], totalMembers)}%)</span>
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all', b.cls)}
                    style={{ width: `${percent(byStatus[b.key], totalMembers)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-5" />
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Overall Savings</span>
              <span className="font-semibold text-gold">{overall}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${overall}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatNaira(totalCollected)} raised of {formatNaira(totalTarget)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-3xl bg-secondary p-6 text-secondary-foreground shadow-sm lg:w-48">
          <ProgressRing
            percent={overall}
            size={112}
            stroke={11}
            trackClassName="text-white/15"
            barClassName="text-gold"
          >
            <span className="font-serif text-2xl font-bold text-gold">{overall}%</span>
          </ProgressRing>
          <p className="mt-3 text-center text-sm text-secondary-foreground/70">Overall Progress</p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-foreground">Savings by Member</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Amounts in millions of naira (target vs. paid).
        </p>
        <div className="mt-5 h-56 min-h-0">
          {isClient ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                barGap={4}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₦${v}M`}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--popover-foreground)',
                  }}
                  formatter={(value, name) => [
                    `₦${Number(value)}M`,
                    name === 'paid' ? 'Paid' : 'Target',
                  ]}
                />
                <Bar dataKey="target" fill="var(--muted)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" fill="#8b6914" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl bg-muted/30">
              <span className="text-sm text-muted-foreground">Loading chart...</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm bg-muted" />
            Target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm bg-gold" />
            Paid
          </span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Members                                                             */
/* ------------------------------------------------------------------ */

export function MembersSection({ members }: { members: Member[] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all')
  const [selected, setSelected] = useState<Member | null>(null)

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = query.toLowerCase()
      const matchesQuery =
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.nuban.includes(q)
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [query, statusFilter, members])

  return (
    <div>
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Members</h1>
        <p className="mt-1 text-muted-foreground">Search and review every registered saver.</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or NUBAN"
            className="h-11 rounded-full pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v: string) => setStatusFilter(v as 'all' | MemberStatus)}
        >
          <SelectTrigger className="h-11 rounded-full sm:w-56">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending_covenant">Pending Covenant</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Showing <strong className="font-semibold text-foreground">{filtered.length}</strong> of{' '}
        {members.length} members
      </p>

      <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="hidden grid-cols-[2fr_0.5fr_1fr_1fr_1fr_0.5fr] items-center gap-4 border-b border-border px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
          <span>Member</span>
          <span>Plots</span>
          <span>Paid</span>
          <span>Remaining</span>
          <span>Status</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No members match your search.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((m) => {
              const paid = savedKobo(m)
              const tgt = targetKobo(m)
              const remaining = Math.max(0, tgt - paid)
              const pct = percent(paid, tgt)
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(m)}
                    className="group grid w-full grid-cols-2 items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40 lg:grid-cols-[2fr_0.5fr_1fr_1fr_1fr_0.5fr]"
                  >
                    <div className="col-span-2 flex items-center gap-3 lg:col-span-1">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-accent text-sm font-bold text-gold">
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{m.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground">{m.plots}</span>
                    <div>
                      <p className="font-semibold text-success">{formatNaira(paid)}</p>
                      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm text-foreground">{formatNaira(remaining)}</span>
                    <span className="col-span-2 lg:col-span-1">
                      <MemberBadge status={m.status} />
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <MemberDrawer member={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Member Detail Drawer                                                */
/* ------------------------------------------------------------------ */

function MemberDrawer({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const paid = member ? savedKobo(member) : 0
  const tgt = member ? targetKobo(member) : 0
  const remaining = Math.max(0, tgt - paid)
  const pct = percent(paid, tgt)
  const plotsDone = member ? Math.floor(paid / PRICE_PER_PLOT_KOBO) : 0

  return (
    <Sheet open={!!member} onOpenChange={(open) => (!open ? onClose() : null)}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        {member ? (
          <>
            <SheetHeader className="pb-0">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 border-2 border-gold/20">
                  <AvatarFallback className="bg-accent font-serif text-lg font-bold text-gold">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="font-serif text-xl">{member.name}</SheetTitle>
                  <SheetDescription className="text-sm">{member.email}</SheetDescription>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <MemberBadge status={member.status} />
                <Badge className="rounded-full border-transparent bg-gold/12 px-3 text-xs text-gold">
                  <LandPlot className="mr-1 size-3" aria-hidden />
                  {plotLabel(member.plots)}
                </Badge>
                {member.covenantSignedAt && (
                  <Badge className="rounded-full border-transparent bg-success/10 px-3 text-xs text-success">
                    <ScrollText className="mr-1 size-3" aria-hidden />
                    Covenant signed
                  </Badge>
                )}
              </div>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-5 pb-8">
              <div className="rounded-2xl bg-secondary p-5 text-secondary-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-secondary-foreground/60">
                      Savings Progress
                    </p>
                    <p className="mt-1 font-serif text-2xl font-bold text-gold">{pct}%</p>
                  </div>
                  <ProgressRing
                    percent={pct}
                    size={72}
                    stroke={8}
                    trackClassName="text-white/15"
                    barClassName="text-gold"
                  >
                    <span className="font-serif text-base font-bold text-gold">{pct}%</span>
                  </ProgressRing>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-secondary-foreground/60">Paid</p>
                    <p className="mt-0.5 font-bold text-gold">{formatNaira(paid)}</p>
                  </div>
                  <div>
                    <p className="text-secondary-foreground/60">Remaining</p>
                    <p className="mt-0.5 font-semibold">{formatNaira(remaining)}</p>
                  </div>
                  <div>
                    <p className="text-secondary-foreground/60">Target</p>
                    <p className="mt-0.5 font-semibold">{formatNaira(tgt)}</p>
                  </div>
                </div>
              </div>

              <dl className="flex flex-col gap-3 rounded-2xl border border-border p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">NUBAN</dt>
                  <dd className="font-mono font-semibold text-foreground">{member.nuban}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Bank</dt>
                  <dd className="font-medium text-foreground">{member.bank}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Plots reserved</dt>
                  <dd className="font-medium text-foreground">{plotLabel(member.plots)}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Plots fully paid</dt>
                  <dd className="font-medium text-foreground">
                    {plotsDone > 0 ? plotLabel(plotsDone) : 'None yet'}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="size-3.5" aria-hidden />
                    Member since
                  </dt>
                  <dd className="font-medium text-foreground">{formatDate(member.memberSince)}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <ScrollText className="size-3.5" aria-hidden />
                    Covenant
                  </dt>
                  <dd className="font-medium text-foreground">
                    {member.covenantSignedAt ? (
                      <span className="text-success">Signed {formatDate(member.covenantSignedAt)}</span>
                    ) : (
                      <span className="text-warning">Not signed</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div>
                <h3 className="font-serif text-base font-bold text-foreground">
                  Transaction History
                </h3>
                {member.transactions.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No transactions recorded yet.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {[...member.transactions]
                      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                      .map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {formatDate(t.date)}
                            </p>
                            <p className="text-xs text-muted-foreground">{t.reference}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-sm font-bold',
                                t.status === 'confirmed'
                                  ? 'text-success'
                                  : t.status === 'failed'
                                    ? 'text-destructive line-through opacity-60'
                                    : 'text-foreground',
                              )}
                            >
                              {formatNaira(t.amountKobo)}
                            </span>
                            <PaymentBadge status={t.status} />
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/*  Certificate Queue                                                   */
/* ------------------------------------------------------------------ */

export function CertificatesSection({ members }: { members: Member[] }) {
  const completed = members.filter((m) => m.status === 'completed')
  const [issued, setIssued] = useState<Set<string>>(new Set())

  const pending = completed.filter((m) => !issued.has(m.id))
  const issuedList = completed.filter((m) => issued.has(m.id))

  function markIssued(m: Member) {
    setIssued((prev) => new Set(prev).add(m.id))
    toast.success(`Certificate marked as issued for ${m.name}`)
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
            Certificate Queue
          </h1>
          <p className="mt-1 text-muted-foreground">
            Members who completed payment and are waiting for land certificates.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className="text-2xl font-bold text-foreground">{pending.length}</span>
          <span className="text-xs text-muted-foreground">pending</span>
        </div>
      </div>

      {pending.length === 0 ? (
        <Empty className="mt-6 rounded-3xl border border-border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 bg-accent text-gold">
              <CheckCircle2 />
            </EmptyMedia>
            <EmptyTitle className="font-serif text-lg font-bold">Queue is clear</EmptyTitle>
            <EmptyDescription>
              Every completed member has been issued a certificate.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {pending.map((m) => {
            const paid = savedKobo(m)
            return (
              <li
                key={m.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-accent text-sm font-bold text-gold">
                      {m.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{m.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plotLabel(m.plots)} &middot; {formatNaira(paid)} paid in full
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => markIssued(m)}
                  className="rounded-full bg-gold text-gold-foreground hover:bg-gold/90"
                >
                  <CheckCircle2 data-icon="inline-start" />
                  Mark as Issued
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {issuedList.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-semibold text-muted-foreground">
            Issued this session ({issuedList.length})
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {issuedList.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 opacity-60"
              >
                <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                <span className="text-sm font-medium text-foreground">{m.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">Certificate issued</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Audit Flags                                                         */
/* ------------------------------------------------------------------ */

// Audit flags are still static in v1 — will be driven by payment webhooks in v2.
const auditFlags = [
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

export function AuditSection() {
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const open = auditFlags.filter((f) => !resolved.has(f.id))
  const resolvedList = auditFlags.filter((f) => resolved.has(f.id))

  function resolve(id: string, memberName: string) {
    setResolved((prev) => new Set(prev).add(id))
    toast.success(`Flag resolved for ${memberName}`)
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
            Audit Flags
          </h1>
          <p className="mt-1 text-muted-foreground">
            Reconciliation mismatches that need a human decision.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className="text-2xl font-bold text-destructive">{open.length}</span>
          <span className="text-xs text-muted-foreground">open flags</span>
        </div>
      </div>

      {open.length === 0 ? (
        <Empty className="mt-6 rounded-3xl border border-border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 bg-accent text-gold">
              <Flag />
            </EmptyMedia>
            <EmptyTitle className="font-serif text-lg font-bold">No open flags</EmptyTitle>
            <EmptyDescription>
              All reconciliation mismatches have been resolved.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {open.map((f) => {
            const variance = f.recordedKobo - f.expectedKobo
            const isOver = variance > 0
            return (
              <li
                key={f.id}
                className="rounded-2xl border border-destructive/20 bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <AlertTriangle className="size-4" aria-hidden />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{f.member}</p>
                        <Badge variant="outline" className="rounded-full text-xs text-muted-foreground">
                          {f.reference}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{f.note}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <span>
                          <span className="text-muted-foreground">Expected: </span>
                          <span className="font-semibold text-foreground">{formatNaira(f.expectedKobo)}</span>
                        </span>
                        <span>
                          <span className="text-muted-foreground">Recorded: </span>
                          <span className="font-semibold text-foreground">{formatNaira(f.recordedKobo)}</span>
                        </span>
                        <span>
                          <span className="text-muted-foreground">Variance: </span>
                          <span className={cn('font-bold', isOver ? 'text-warning' : 'text-destructive')}>
                            {isOver ? '+' : ''}{formatNaira(variance)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => resolve(f.id, f.member)}
                    className="shrink-0 rounded-full border-gold/40 text-gold hover:bg-accent hover:text-gold"
                  >
                    Resolve
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {resolvedList.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-semibold text-muted-foreground">
            Resolved this session ({resolvedList.length})
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {resolvedList.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 opacity-60"
              >
                <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                <span className="text-sm font-medium text-foreground">{f.member}</span>
                <Badge variant="outline" className="rounded-full text-xs text-muted-foreground">
                  {f.reference}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">Resolved</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
