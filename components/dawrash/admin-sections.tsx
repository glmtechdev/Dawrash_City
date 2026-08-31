'use client'

import { useMemo, useState } from 'react'
import { ProgressRing } from '@/components/dawrash/progress-ring'
import { MemberBadge, PaymentBadge } from '@/components/dawrash/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  targetKobo,
  type MemberStatus,
  type PaymentStatus,
  PRICE_PER_PLOT_KOBO,
  TOTAL_PROJECT_PLOTS,
  TOTAL_PROJECT_TARGET_KOBO,
} from '@/lib/dawrash-data'
import {
  type AdminMember,
  type AdminTransaction,
  type AdminAuditFlag,
  type AdminCertificate,
  recordManualTransactionAction,
  updateTransactionStatusAction,
  issueCertificateAction,
  updateCertificateDeliveryAction,
  resolveAuditFlagAction,
  updateMemberAdminRoleAction,
} from '@/app/admin/actions'
import {
  Users,
  Wallet,
  Target,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  CalendarDays,
  ScrollText,
  LandPlot,
  Receipt,
  Download,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Clock,
  ExternalLink,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                    */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  if (!iso) return 'N/A'
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function percent(a: number, b: number) {
  if (b <= 0) return 0
  return Math.min(100, Math.round((a / b) * 100))
}

function memberSavedKobo(member: AdminMember): number {
  return member.transactions
    .filter((t) => t.status === 'confirmed')
    .reduce((sum, t) => sum + t.amountKobo, 0)
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/* ================================================================== */
/*  1. OVERVIEW SECTION                                               */
/* ================================================================== */

export function OverviewSection({
  members,
  transactions,
  auditFlags,
  certificates,
  onNavigate,
  onOpenRecordPayment,
}: {
  members: AdminMember[]
  transactions: AdminTransaction[]
  auditFlags: AdminAuditFlag[]
  certificates: AdminCertificate[]
  onNavigate: (section: 'members' | 'transactions' | 'certificates' | 'audit') => void
  onOpenRecordPayment: (memberId?: string) => void
}) {
  const totalMembers = members.length
  const totalTargetKobo = members.reduce((sum, m) => sum + targetKobo(m), 0)

  const confirmedTx = transactions.filter((t) => t.status === 'confirmed')
  const totalCollectedKobo = confirmedTx.reduce((sum, t) => sum + t.amountKobo, 0)

  const pendingTx = transactions.filter((t) => t.status === 'pending')
  const totalPendingKobo = pendingTx.reduce((sum, t) => sum + t.amountKobo, 0)

  const overallProgress = percent(totalCollectedKobo, totalTargetKobo)
  const totalPlotsReserved = members.reduce((s, m) => s + m.plots, 0)
  const totalPlotsPaid = Math.floor(totalCollectedKobo / PRICE_PER_PLOT_KOBO)

  const byStatus: Record<MemberStatus, number> = {
    active: 0,
    completed: 0,
    pending_covenant: 0,
  }
  members.forEach((m) => {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1
  })

  const openFlagsCount = auditFlags.filter((f) => !f.resolved).length
  const pendingCertsCount = members.filter((m) => m.status === 'completed' || memberSavedKobo(m) >= targetKobo(m)).length

  // Export handlers
  function exportMembersCsv() {
    const headers = ['ID', 'Name', 'Email', 'Status', 'Plots', 'Paid (NGN)', 'Target (NGN)', 'Covenant Signed']
    const rows = members.map((m) => {
      const paid = memberSavedKobo(m) / 100
      const tgt = targetKobo(m) / 100
      return [
        `"${m.id}"`,
        `"${m.name}"`,
        `"${m.email}"`,
        `"${m.status}"`,
        m.plots,
        paid,
        tgt,
        m.covenantSignedAt ? `"${formatDate(m.covenantSignedAt)}"` : '"Not signed"',
      ].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    downloadCsv(`dawrash-members-${new Date().toISOString().split('T')[0]}.csv`, csv)
    toast.success('Members ledger exported to CSV')
  }

  function exportTransactionsCsv() {
    const headers = ['Reference', 'Member Name', 'Member Email', 'Amount (NGN)', 'Method', 'Status', 'Paid At', 'Notes']
    const rows = transactions.map((t) => [
      `"${t.reference}"`,
      `"${t.memberName || 'N/A'}"`,
      `"${t.memberEmail || 'N/A'}"`,
      t.amountKobo / 100,
      `"${t.method}"`,
      `"${t.status}"`,
      `"${t.paidAt}"`,
      `"${t.notes || ''}"`,
    ].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    downloadCsv(`dawrash-transactions-${new Date().toISOString().split('T')[0]}.csv`, csv)
    toast.success('Transactions ledger exported to CSV')
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Executive Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dawrash City land savings program financial & member summary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => onOpenRecordPayment()}
            className="rounded-full bg-gold font-semibold text-gold-foreground hover:bg-gold/90 shadow-sm"
          >
            <PlusCircle className="mr-1.5 size-4" />
            Record Payment
          </Button>

          <Button
            variant="outline"
            onClick={exportTransactionsCsv}
            className="rounded-full border-border hover:bg-accent"
          >
            <Download className="mr-1.5 size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Collected */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <Wallet className="size-5" />
            </span>
            <Badge variant="outline" className="border-success/30 bg-success/5 text-success text-[11px]">
              {overallProgress}% of committed target
            </Badge>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Inflows Collected
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-foreground">
            {formatNaira(totalCollectedKobo)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            of {formatNaira(totalTargetKobo)} subscribed target
          </p>
        </div>

        {/* Plots Allocation */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <LandPlot className="size-5" />
            </span>
            <Badge variant="outline" className="border-gold/30 bg-gold/5 text-gold text-[11px]">
              {percent(totalPlotsReserved, TOTAL_PROJECT_PLOTS)}% subscribed
            </Badge>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Plots Allocation
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-foreground">
            {totalPlotsReserved.toLocaleString()}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              / {TOTAL_PROJECT_PLOTS.toLocaleString()} Master Plan Plots
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalPlotsPaid} fully paid · {(TOTAL_PROJECT_PLOTS - totalPlotsReserved).toLocaleString()} unallocated plots
          </p>
        </div>

        {/* Registered Members */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-gold">
              <Users className="size-5" />
            </span>
            <span className="text-xs text-muted-foreground">{byStatus.completed} fully paid</span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Church Savers
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-foreground">
            {totalMembers}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {byStatus.active} active · {byStatus.pending_covenant} pending covenant
          </p>
        </div>

        {/* Operational Health */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className={cn(
              'flex size-10 items-center justify-center rounded-xl',
              openFlagsCount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
            )}>
              {openFlagsCount > 0 ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
            </span>
            {totalPendingKobo > 0 && (
              <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning text-[10px]">
                {formatNaira(totalPendingKobo)} pending
              </Badge>
            )}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Audit Discrepancies
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-foreground">
            {openFlagsCount}{' '}
            <span className="text-xs font-normal text-muted-foreground">Open flags</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {openFlagsCount === 0 ? 'All transactions reconciled' : 'Requires review in Audit tab'}
          </p>
        </div>
      </div>

      {/* Breakdown & Progress Rings */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Status Breakdown Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-foreground">Member Status & Inflow Progress</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportMembersCsv}
              className="text-xs text-gold hover:text-gold"
            >
              Export Directory CSV
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Active Savers</span>
                <span className="text-muted-foreground">
                  {byStatus.active} members ({percent(byStatus.active, totalMembers)}%)
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${percent(byStatus.active, totalMembers)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Completed (Certificate Eligible)</span>
                <span className="text-muted-foreground">
                  {byStatus.completed} members ({percent(byStatus.completed, totalMembers)}%)
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${percent(byStatus.completed, totalMembers)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Pending Covenant Sign-off</span>
                <span className="text-muted-foreground">
                  {byStatus.pending_covenant} members ({percent(byStatus.pending_covenant, totalMembers)}%)
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-warning transition-all"
                  style={{ width: `${percent(byStatus.pending_covenant, totalMembers)}%` }}
                />
              </div>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">{totalPlotsReserved}</span> Plots under covenant
            </div>
            <div>
              <span className="font-semibold text-success">{formatNaira(totalCollectedKobo)}</span> Confirmed bank inflows
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => onNavigate('members')}
              className="h-auto p-0 text-gold"
            >
              View all members →
            </Button>
          </div>
        </div>

        {/* Executive Target Dial */}
        <div className="flex flex-col items-center justify-center rounded-3xl bg-secondary p-6 text-secondary-foreground shadow-sm">
          <ProgressRing
            percent={overallProgress}
            size={130}
            stroke={12}
            trackClassName="text-white/15"
            barClassName="text-gold"
          >
            <span className="font-serif text-3xl font-extrabold text-gold">{overallProgress}%</span>
          </ProgressRing>

          <h3 className="mt-4 font-serif text-base font-bold text-foreground">Program Target</h3>
          <p className="mt-1 text-center text-xs text-secondary-foreground/70">
            {formatNaira(totalCollectedKobo)} of {formatNaira(totalTargetKobo)}
          </p>

          <div className="mt-5 grid w-full grid-cols-2 gap-2 rounded-2xl bg-black/20 p-3 text-center text-xs">
            <div>
              <p className="text-secondary-foreground/60">Plots Paid</p>
              <p className="mt-0.5 font-bold text-gold">{totalPlotsPaid}</p>
            </div>
            <div>
              <p className="text-secondary-foreground/60">Target Plots</p>
              <p className="mt-0.5 font-bold text-white">{totalPlotsReserved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Inflow Feed */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground">Recent Inflows</h2>
            <p className="text-xs text-muted-foreground">Latest transaction activities recorded across all members.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('transactions')}
            className="text-xs text-gold hover:text-gold"
          >
            View full ledger ({transactions.length}) →
          </Button>
        </div>

        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No transactions recorded yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-xl',
                    tx.status === 'confirmed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  )}>
                    <Receipt className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tx.memberName || 'Member'}</p>
                    <p className="text-xs text-muted-foreground">{tx.reference} · {formatDate(tx.paidAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">{formatNaira(tx.amountKobo)}</p>
                  <PaymentBadge status={tx.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  2. MEMBERS SECTION                                                */
/* ================================================================== */

export function MembersSection({
  members,
  onRefresh,
  onOpenRecordPayment,
}: {
  members: AdminMember[]
  onRefresh: () => void
  onOpenRecordPayment: (memberId?: string) => void
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin'>('all')
  const [selected, setSelected] = useState<AdminMember | null>(null)

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = query.toLowerCase()
      const matchesQuery =
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter
      const matchesRole = roleFilter === 'all' || (roleFilter === 'admin' && (m.isAdmin || m.isSuperadmin))
      return matchesQuery && matchesStatus && matchesRole
    })
  }, [query, statusFilter, roleFilter, members])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Members Directory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect, manage plot quotas, and configure admin privileges.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by member name or email..."
            className="h-11 rounded-full pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v: string) => setStatusFilter(v as 'all' | MemberStatus)}
        >
          <SelectTrigger className="h-11 rounded-full sm:w-48">
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

        <Select
          value={roleFilter}
          onValueChange={(v: string) => setRoleFilter(v as 'all' | 'admin')}
        >
          <SelectTrigger className="h-11 rounded-full sm:w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admins only</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <strong className="font-semibold text-foreground">{filtered.length}</strong> of{' '}
        {members.length} church members
      </p>

      {/* Members Table */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="hidden grid-cols-[2fr_0.6fr_1fr_1fr_1fr_0.4fr] items-center gap-4 border-b border-border px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
          <span>Member</span>
          <span>Plots</span>
          <span>Paid</span>
          <span>Remaining</span>
          <span>Status & Roles</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            No church members matched your filter criteria.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((m) => {
              const paid = memberSavedKobo(m)
              const tgt = targetKobo(m)
              const remaining = Math.max(0, tgt - paid)
              const pct = percent(paid, tgt)
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(m)}
                    className="group grid w-full grid-cols-2 items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40 lg:grid-cols-[2fr_0.6fr_1fr_1fr_1fr_0.4fr]"
                  >
                    <div className="col-span-2 flex items-center gap-3 lg:col-span-1">
                      <Avatar className="size-9 shrink-0 border border-gold/20">
                        <AvatarFallback className="bg-accent text-sm font-bold text-gold">
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-foreground">{m.name}</p>
                          {m.isSuperadmin ? (
                            <Badge className="border-gold/40 bg-gold/15 text-[10px] text-gold py-0">Superadmin</Badge>
                          ) : m.isAdmin ? (
                            <Badge variant="outline" className="text-[10px] py-0">Admin</Badge>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>

                    <span className="text-sm font-medium text-foreground">
                      {m.plots} {m.plots === 1 ? 'plot' : 'plots'}
                    </span>

                    <div>
                      <p className="font-semibold text-success">{formatNaira(paid)}</p>
                      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <span className="text-sm text-foreground">{formatNaira(remaining)}</span>

                    <div className="col-span-2 flex items-center gap-2 lg:col-span-1">
                      <MemberBadge status={m.status} />
                    </div>

                    <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <MemberDrawer
        member={selected}
        onClose={() => setSelected(null)}
        onRefresh={onRefresh}
        onOpenRecordPayment={onOpenRecordPayment}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Member Detail & Role Control Drawer                               */
/* ------------------------------------------------------------------ */

export function MemberDrawer({
  member,
  onClose,
  onRefresh,
  onOpenRecordPayment,
}: {
  member: AdminMember | null
  onClose: () => void
  onRefresh: () => void
  onOpenRecordPayment: (memberId?: string) => void
}) {
  if (!member) return null

  const paid = memberSavedKobo(member)
  const tgt = targetKobo(member)
  const remaining = Math.max(0, tgt - paid)
  const pct = percent(paid, tgt)
  const plotsDone = Math.floor(paid / PRICE_PER_PLOT_KOBO)

  return (
    <Sheet open={!!member} onOpenChange={(open) => (!open ? onClose() : null)}>
      <SheetContent className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="p-6 pb-4 sm:p-7 sm:pb-4 text-left border-b border-border/60">
          <div className="flex items-center gap-3.5 pr-8">
            <Avatar className="size-12 border-2 border-gold/30 shrink-0">
              <AvatarFallback className="bg-accent font-serif text-lg font-bold text-gold">
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="font-serif text-xl leading-tight truncate">{member.name}</SheetTitle>
              <SheetDescription className="text-xs truncate">{member.email}</SheetDescription>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <MemberBadge status={member.status} />
            <Badge className="rounded-full border-transparent bg-gold/12 px-3 text-xs text-gold">
              <LandPlot className="mr-1 size-3" />
              {plotLabel(member.plots)}
            </Badge>
            {member.covenantSignedAt && (
              <Badge className="rounded-full border-transparent bg-success/10 px-3 text-xs text-success">
                <ScrollText className="mr-1 size-3" />
                Signed {formatDate(member.covenantSignedAt)}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 p-6 sm:p-7 pb-10">
          {/* Savings Dial Card */}
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

          {/* Role Status & Quota Summary */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-gold" />
                <span className="text-xs font-semibold text-foreground">Access Role</span>
              </div>
              <div>
                {member.isSuperadmin ? (
                  <Badge className="border-gold/40 bg-gold/15 text-gold text-xs font-semibold">
                    Superadmin
                  </Badge>
                ) : member.isAdmin ? (
                  <Badge variant="outline" className="border-border text-foreground text-xs">
                    Administrator
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs text-muted-foreground">
                    Church Member
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
              <div>
                <p className="text-xs font-semibold text-foreground">Land Allocation Quota</p>
                <p className="text-[11px] text-muted-foreground">Member-selected covenant target</p>
              </div>
              <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold font-bold text-xs">
                {plotLabel(member.plots)}
              </Badge>
            </div>
          </div>

          {/* Member Details List */}
          <dl className="flex flex-col gap-2.5 rounded-2xl border border-border p-4 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Plots fully paid</dt>
              <dd className="font-medium text-foreground">
                {plotsDone > 0 ? `${plotsDone} Plot(s)` : 'None yet'}
              </dd>
            </div>
            <Separator />
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Registration Date (created_at)</dt>
              <dd className="font-medium text-foreground">{formatDate(member.createdAt || member.memberSince || '')}</dd>
            </div>
          </dl>

          {/* Member Linked Transactions */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold text-foreground">
                Payment History ({member.transactions.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onOpenRecordPayment(member.id)
                }}
                className="h-7 rounded-full text-xs border-gold/40 text-gold"
              >
                <PlusCircle className="mr-1 size-3" />
                Add Payment
              </Button>
            </div>

            {member.transactions.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No payments recorded for this member yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {member.transactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-border p-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{formatDate(t.paidAt)}</p>
                      <p className="text-[11px] text-muted-foreground">{t.reference} · {t.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-success">{formatNaira(t.amountKobo)}</p>
                      <PaymentBadge status={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ================================================================== */
/*  3. TRANSACTIONS SECTION (NEW)                                     */
/* ================================================================== */

export function TransactionsSection({
  transactions,
  members,
  onRefresh,
  onOpenRecordPayment,
}: {
  transactions: AdminTransaction[]
  members: AdminMember[]
  onRefresh: () => void
  onOpenRecordPayment: (memberId?: string) => void
}) {
  const [filter, setFilter] = useState<'all' | PaymentStatus>('all')
  const [query, setQuery] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const q = query.toLowerCase()
      const matchesQuery =
        t.reference.toLowerCase().includes(q) ||
        (t.memberName && t.memberName.toLowerCase().includes(q)) ||
        (t.memberEmail && t.memberEmail.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      const matchesStatus = filter === 'all' || t.status === filter
      return matchesQuery && matchesStatus
    })
  }, [query, filter, transactions])

  async function handleUpdateStatus(txId: string, status: PaymentStatus) {
    setConfirmingId(txId)
    const res = await updateTransactionStatusAction(txId, status)
    setConfirmingId(null)
    if (res.success) {
      toast.success(`Transaction marked as ${status}`)
      onRefresh()
    } else {
      toast.error(res.error || 'Failed to update transaction status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Transactions Ledger
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete record of automated Paystack and offline church bank transfers.
          </p>
        </div>

        <Button
          onClick={() => onOpenRecordPayment()}
          className="rounded-full bg-gold font-semibold text-gold-foreground hover:bg-gold/90 shadow-sm"
        >
          <PlusCircle className="mr-1.5 size-4" />
          Record Offline Transfer
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reference, member name or note..."
            className="h-11 rounded-full pl-10"
          />
        </div>

        <div className="flex rounded-full border border-border bg-card p-1">
          {(['all', 'confirmed', 'pending', 'failed'] as const).map((tab) => {
            const count = transactions.filter((t) => (tab === 'all' ? true : t.status === tab)).length
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors',
                  filter === tab
                    ? 'bg-gold text-gold-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span>{tab}</span>
                {count > 0 && (
                  <span className={cn(
                    'inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold',
                    filter === tab ? 'bg-black/20 text-gold-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Transaction List Table */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="hidden grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
          <span>Reference / Method</span>
          <span>Member</span>
          <span>Date</span>
          <span>Amount</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-12 bg-accent text-gold">
                <Receipt />
              </EmptyMedia>
              <EmptyTitle className="font-serif text-lg font-bold">No transactions found</EmptyTitle>
              <EmptyDescription>
                {filter === 'all'
                  ? 'No payment entries match your search query.'
                  : `No ${filter} transactions found.`}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-3 px-5 py-4 sm:grid sm:grid-cols-2 lg:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr] lg:items-center lg:gap-4 lg:px-6"
              >
                <div className="flex items-center justify-between sm:block">
                  <div>
                    <p className="font-mono text-xs font-bold text-foreground">{t.reference}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.method}</p>
                  </div>
                  <div className="sm:hidden">
                    <PaymentBadge status={t.status} />
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-foreground">{t.memberName || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{t.memberEmail || ''}</p>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>{formatDate(t.paidAt)}</p>
                  {t.notes && <p className="truncate text-[10px] text-muted-foreground/80">{t.notes}</p>}
                </div>

                <div className="flex items-baseline justify-between sm:block">
                  <div>
                    <p className="font-serif font-bold text-success text-base sm:text-sm">{formatNaira(t.amountKobo)}</p>
                    {t.feeKobo ? (
                      <p className="text-[10px] text-muted-foreground">Fee: {formatNaira(t.feeKobo)}</p>
                    ) : null}
                  </div>
                </div>

                <div className="hidden sm:block">
                  <PaymentBadge status={t.status} />
                </div>

                <div className="flex items-center justify-end gap-1.5 border-t border-border/50 pt-2 sm:border-t-0 sm:pt-0 sm:col-span-2 lg:col-span-1">
                  {t.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        disabled={confirmingId === t.id}
                        onClick={() => handleUpdateStatus(t.id, 'confirmed')}
                        className="h-7 rounded-full bg-success text-success-foreground text-xs px-3"
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={confirmingId === t.id}
                        onClick={() => handleUpdateStatus(t.id, 'failed')}
                        className="h-7 rounded-full text-destructive text-xs px-3 hover:bg-destructive/10"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  4. CERTIFICATE QUEUE SECTION                                      */
/* ================================================================== */

export function CertificatesSection({
  members,
  certificates,
  onRefresh,
}: {
  members: AdminMember[]
  certificates: AdminCertificate[]
  onRefresh: () => void
}) {
  const [issueModalMember, setIssueModalMember] = useState<AdminMember | null>(null)
  const [plotNumbersInput, setPlotNumbersInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Members who have completed their payment quota
  const completedMembers = useMemo(() => {
    return members.filter((m) => m.status === 'completed' || memberSavedKobo(m) >= targetKobo(m))
  }, [members])

  const certsByMember = useMemo(() => {
    const map = new Map<string, AdminCertificate>()
    certificates.forEach((c) => map.set(c.memberId, c))
    return map
  }, [certificates])

  async function handleIssueCertificate() {
    if (!issueModalMember || !plotNumbersInput.trim()) {
      toast.error('Please specify the plot numbers (e.g. Plot 14 & 15, Block B)')
      return
    }
    setSubmitting(true)
    const res = await issueCertificateAction(issueModalMember.id, plotNumbersInput)
    setSubmitting(false)
    if (res.success) {
      toast.success(`Certificate issued for ${issueModalMember.name}`)
      setIssueModalMember(null)
      setPlotNumbersInput('')
      onRefresh()
    } else {
      toast.error(res.error || 'Failed to issue certificate')
    }
  }

  async function handleToggleDelivery(cert: AdminCertificate) {
    const nextState = !cert.delivered
    const res = await updateCertificateDeliveryAction(cert.id, nextState)
    if (res.success) {
      toast.success(`Marked as ${nextState ? 'delivered' : 'undelivered'}`)
      onRefresh()
    } else {
      toast.error(res.error || 'Failed to update certificate delivery')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Certificate Queue & Allocation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign surveyed plot numbers and record physical title certificate handovers.
          </p>
        </div>
        <div className="text-right">
          <span className="font-serif text-2xl font-bold text-foreground">{completedMembers.length}</span>
          <p className="text-xs text-muted-foreground">Eligible Savers</p>
        </div>
      </div>

      {completedMembers.length === 0 ? (
        <Empty className="rounded-3xl border border-border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 bg-accent text-gold">
              <CheckCircle2 />
            </EmptyMedia>
            <EmptyTitle className="font-serif text-lg font-bold">Queue is clear</EmptyTitle>
            <EmptyDescription>
              No church members have completed full plot savings yet. Completed savers will automatically appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          <ul className="flex flex-col gap-3">
            {completedMembers.map((m) => {
              const cert = certsByMember.get(m.id)
              const isIssued = !!cert?.issuedAt

              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar className="size-11 shrink-0 border border-gold/30">
                      <AvatarFallback className="bg-accent font-serif text-sm font-bold text-gold">
                        {m.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{m.name}</p>
                        {isIssued ? (
                          <Badge className="border-success/30 bg-success/10 text-success text-[10px]">
                            Issued
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning text-[10px]">
                            Needs Plot Assignment
                          </Badge>
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {plotLabel(m.plots)} · {formatNaira(memberSavedKobo(m))} paid in full
                      </p>

                      {cert?.plotNumbers && (
                        <p className="mt-1 text-xs font-semibold text-gold">
                          Assigned: {cert.plotNumbers}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isIssued ? (
                      <Button
                        onClick={() => {
                          setIssueModalMember(m)
                          setPlotNumbersInput('')
                        }}
                        className="rounded-full bg-gold font-semibold text-gold-foreground hover:bg-gold/90"
                      >
                        <LandPlot className="mr-1.5 size-4" />
                        Assign Plots & Issue
                      </Button>
                    ) : (
                      <Button
                        variant={cert.delivered ? 'outline' : 'default'}
                        onClick={() => handleToggleDelivery(cert)}
                        className={cn(
                          'rounded-full text-xs',
                          cert.delivered ? 'border-success/40 text-success' : 'bg-success text-success-foreground'
                        )}
                      >
                        <CheckCircle2 className="mr-1.5 size-3.5" />
                        {cert.delivered ? 'Delivered to Member' : 'Mark Handed Over'}
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Plot Assignment Modal */}
      <Dialog open={!!issueModalMember} onOpenChange={(open) => (!open ? setIssueModalMember(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Assign Plot Numbers</DialogTitle>
            <DialogDescription>
              Record the surveyed plot identification numbers from the Dawrash City master survey plan.
            </DialogDescription>
          </DialogHeader>

          {issueModalMember && (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl bg-muted/50 p-3 text-xs">
                <p className="font-semibold text-foreground">{issueModalMember.name}</p>
                <p className="text-muted-foreground">{plotLabel(issueModalMember.plots)} reserved · {issueModalMember.email}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Assigned Plot Numbers</label>
                <Input
                  value={plotNumbersInput}
                  onChange={(e) => setPlotNumbersInput(e.target.value)}
                  placeholder="e.g. Plot 104, Block C (Phase 1)"
                  className="mt-1.5"
                  autoFocus
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  This will be recorded permanently in the certificates database.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIssueModalMember(null)}>
              Cancel
            </Button>
            <Button
              disabled={submitting || !plotNumbersInput.trim()}
              onClick={handleIssueCertificate}
              className="bg-gold text-gold-foreground hover:bg-gold/90 font-semibold"
            >
              {submitting ? 'Issuing…' : 'Confirm & Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ================================================================== */
/*  5. AUDIT FLAGS SECTION                                            */
/* ================================================================== */

export function AuditSection({
  auditFlags,
  onRefresh,
}: {
  auditFlags: AdminAuditFlag[]
  onRefresh: () => void
}) {
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const openFlags = auditFlags.filter((f) => !f.resolved)
  const resolvedFlags = auditFlags.filter((f) => f.resolved)

  async function handleResolve(flagId: string) {
    setResolvingId(flagId)
    const res = await resolveAuditFlagAction(flagId)
    setResolvingId(null)
    if (res.success) {
      toast.success('Audit discrepancy marked as resolved')
      onRefresh()
    } else {
      toast.error(res.error || 'Failed to resolve audit flag')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Audit & Reconciliation Flags
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inflow discrepancies, bank pledge mismatches, and duplicate reference alerts.
          </p>
        </div>
        <div className="text-right">
          <span className="font-serif text-2xl font-bold text-destructive">{openFlags.length}</span>
          <p className="text-xs text-muted-foreground">Open Flags</p>
        </div>
      </div>

      {openFlags.length === 0 ? (
        <Empty className="rounded-3xl border border-border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 bg-accent text-gold">
              <CheckCircle2 />
            </EmptyMedia>
            <EmptyTitle className="font-serif text-lg font-bold">No open flags</EmptyTitle>
            <EmptyDescription>
              All bank inflows match their intended transaction amounts.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {openFlags.map((f) => {
            const isOver = f.varianceKobo > 0
            return (
              <li
                key={f.id}
                className="rounded-2xl border border-destructive/25 bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <AlertTriangle className="size-4" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{f.memberName || 'Member'}</p>
                        <Badge variant="outline" className="rounded-full font-mono text-[10px] text-muted-foreground">
                          {f.reference}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{f.note}</p>

                      <div className="mt-2.5 flex flex-wrap gap-4 text-xs">
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
                            {isOver ? '+' : ''}{formatNaira(f.varianceKobo)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={resolvingId === f.id}
                    onClick={() => handleResolve(f.id)}
                    className="shrink-0 rounded-full border-gold/40 text-gold hover:bg-accent hover:text-gold"
                  >
                    Resolve Discrepancy
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {resolvedFlags.length > 0 && (
        <div className="mt-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resolved Audit Trail ({resolvedFlags.length})
          </p>
          <ul className="flex flex-col gap-2">
            {resolvedFlags.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 opacity-60 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-success" />
                  <span className="font-medium text-foreground">{f.memberName}</span>
                  <span className="font-mono text-muted-foreground">{f.reference}</span>
                </div>
                <span className="text-muted-foreground">
                  Resolved {f.resolvedAt ? formatDate(f.resolvedAt) : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  6. RECORD OFFLINE / BANK TRANSFER MODAL                           */
/* ================================================================== */

export function RecordPaymentModal({
  open,
  defaultMemberId,
  members,
  onClose,
  onSuccess,
}: {
  open: boolean
  defaultMemberId?: string
  members: AdminMember[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [memberId, setMemberId] = useState(defaultMemberId || members[0]?.id || '')
  const [nairaAmount, setNairaAmount] = useState('')
  const [method, setMethod] = useState('Direct Bank Transfer')
  const [reference, setReference] = useState('')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const naira = Number(nairaAmount)
    if (!memberId) return toast.error('Please select a church member')
    if (!naira || naira <= 0) return toast.error('Please enter a valid amount')

    setLoading(true)
    const amountKobo = Math.round(naira * 100)
    const res = await recordManualTransactionAction({
      memberId,
      amountKobo,
      method,
      reference: reference.trim() || undefined,
      paidAt,
      notes: notes.trim() || undefined,
    })
    setLoading(false)

    if (res.success) {
      toast.success('Offline payment recorded successfully')
      onSuccess()
      onClose()
    } else {
      toast.error(res.error || 'Failed to record transaction')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Record Offline Payment</DialogTitle>
          <DialogDescription>
            Log a direct church account bank transfer or cash deposit toward a member&apos;s plot target.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-foreground">Member</label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Amount (NGN)</label>
              <Input
                type="number"
                min={100}
                value={nairaAmount}
                onChange={(e) => setNairaAmount(e.target.value)}
                placeholder="e.g. 500000"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Payment Date</label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Payment Method</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct Bank Transfer">Direct Bank Transfer</SelectItem>
                  <SelectItem value="POS Transfer">POS Transfer</SelectItem>
                  <SelectItem value="Cash Deposit">Cash Deposit</SelectItem>
                  <SelectItem value="Paystack Manual">Paystack Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Bank Ref / Receipt #</label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. REF-99482"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Superadmin Audit Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Confirmed in church bank statement"
              className="mt-1"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gold text-gold-foreground hover:bg-gold/90 font-semibold"
            >
              {loading ? 'Recording…' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
