'use client'

import Link from 'next/link'
import { Brand } from '@/components/dawrash/brand'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Flag, FileCheck } from 'lucide-react'

export type AdminSection = 'overview' | 'members' | 'audit' | 'certificates'

const nav: { value: AdminSection; label: string; icon: typeof Users }[] = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'members', label: 'Members', icon: Users },
  { value: 'audit', label: 'Audit Flags', icon: Flag },
  { value: 'certificates', label: 'Certificate Queue', icon: FileCheck },
]

export function AdminShell({
  section,
  onSection,
  children,
}: {
  section: AdminSection
  onSection: (s: AdminSection) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100svh] bg-background">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-[100svh] w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <Link href="/" aria-label="Dawrash City home">
          <Brand tone="light" subtitle />
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon
            const active = section === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSection(item.value)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="size-4.5" aria-hidden />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-sidebar-accent p-4 text-sidebar-accent-foreground">
          <p className="text-xs uppercase tracking-wide text-sidebar-foreground/70">Signed in as</p>
          <p className="mt-1 text-sm font-semibold">Administrator</p>
          <Link href="/dashboard" className="mt-2 inline-block text-xs font-medium text-gold hover:underline">
            Exit to member view
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top tabs (mobile) */}
        <header className="border-b border-border bg-card md:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <Brand subtitle />
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
            {nav.map((item) => {
              const active = section === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onSection(item.value)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    active ? 'bg-gold text-gold-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 md:px-8">{children}</main>
      </div>
    </div>
  )
}
