import { useState } from 'react'
import Link from 'next/link'
import { Brand } from '@/components/dawrash/brand'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileCheck,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Menu,
  ClipboardList,
} from 'lucide-react'

export type AdminSection = 'overview' | 'members' | 'transactions' | 'applications' | 'certificates' | 'audit'

export type AdminCounts = {
  pendingTransactions?: number
  pendingApplications?: number
  pendingCertificates?: number
  unresolvedFlags?: number
}

const navItems: {
  value: AdminSection
  label: string
  shortLabel: string
  icon: typeof Users
  badgeKey?: keyof AdminCounts
  badgeColor?: string
}[] = [
  { value: 'overview', label: 'Executive Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { value: 'members', label: 'Members Directory', shortLabel: 'Members', icon: Users },
  {
    value: 'transactions',
    label: 'All Transactions',
    shortLabel: 'Transactions',
    icon: Receipt,
    badgeKey: 'pendingTransactions',
    badgeColor: 'bg-warning/20 text-warning border-warning/30',
  },
  {
    value: 'applications',
    label: 'Plot Applications',
    shortLabel: 'Applications',
    icon: ClipboardList,
    badgeKey: 'pendingApplications',
    badgeColor: 'bg-gold/20 text-gold border-gold/30',
  },
  {
    value: 'certificates',
    label: 'Certificate Queue',
    shortLabel: 'Certificates',
    icon: FileCheck,
    badgeKey: 'pendingCertificates',
    badgeColor: 'bg-success/20 text-success border-success/30',
  },
  {
    value: 'audit',
    label: 'Audit Flags',
    shortLabel: 'Audit',
    icon: AlertTriangle,
    badgeKey: 'unresolvedFlags',
    badgeColor: 'bg-destructive/20 text-destructive border-destructive/30',
  },
]

export function AdminShell({
  section,
  onSection,
  counts = {},
  children,
}: {
  section: AdminSection
  onSection: (s: AdminSection) => void
  counts?: AdminCounts
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const totalAlerts =
    (counts.pendingTransactions || 0) +
    (counts.pendingApplications || 0) +
    (counts.pendingCertificates || 0) +
    (counts.unresolvedFlags || 0)

  return (
    <div className="flex min-h-[100svh] bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-[100svh] w-68 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <Link href="/" aria-label="Dawrash City home">
          <Brand tone="light" subtitle />
        </Link>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold">
          <ShieldAlert className="size-4 shrink-0 text-gold" />
          <span>Superadmin Console</span>
        </div>

        <nav className="mt-6 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = section === item.value
            const badgeCount = item.badgeKey ? counts[item.badgeKey] ?? 0 : 0

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSection(item.value)}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4.5 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </div>
                {badgeCount > 0 && (
                  <Badge
                    variant="outline"
                    className={cn('rounded-full px-2 py-0 text-[10px] font-bold border', item.badgeColor)}
                  >
                    {badgeCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent p-4 text-sidebar-accent-foreground">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/70">
            Current Session
          </p>
          <p className="mt-1 font-serif text-sm font-bold text-sidebar-foreground">
            Church Administrator
          </p>
          <Link
            href="/dashboard"
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
          >
            <span>Exit to member view</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer (Slideout from Left) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-6 bg-sidebar text-sidebar-foreground">
          <SheetHeader className="p-0 text-left">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Brand tone="light" subtitle />
            </Link>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold">
              <ShieldAlert className="size-4 shrink-0 text-gold" />
              <span>Superadmin Console</span>
            </div>
          </SheetHeader>

          <nav className="mt-6 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = section === item.value
              const badgeCount = item.badgeKey ? counts[item.badgeKey] ?? 0 : 0

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onSection(item.value)
                    setMobileOpen(false)
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4.5 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                  </div>
                  {badgeCount > 0 && (
                    <Badge
                      variant="outline"
                      className={cn('rounded-full px-2 py-0 text-[10px] font-bold border', item.badgeColor)}
                    >
                      {badgeCount}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent p-4 text-sidebar-accent-foreground">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/70">
              Current Session
            </p>
            <p className="mt-1 font-serif text-sm font-bold text-sidebar-foreground">
              Church Administrator
            </p>
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
            >
              <span>Exit to member view</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header & Horizontal Tabs */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Brand subtitle />
            <div className="flex items-center gap-2">
              <Badge className="border-gold/30 bg-gold/10 text-gold text-xs font-semibold">Superadmin</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileOpen(true)}
                className="relative size-9 p-0 rounded-full border-border"
                aria-label="Open admin menu"
              >
                <Menu className="size-4.5 text-foreground" />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-destructive" />
                  </span>
                )}
              </Button>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-none">
            {navItems.map((item) => {
              const active = section === item.value
              const badgeCount = item.badgeKey ? counts[item.badgeKey] ?? 0 : 0
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onSection(item.value)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                    active
                      ? 'bg-gold text-gold-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span>{item.shortLabel}</span>
                  {badgeCount > 0 && (
                    <span className={cn(
                      'inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold',
                      active ? 'bg-black/25 text-gold-foreground' : 'bg-destructive text-destructive-foreground'
                    )}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
