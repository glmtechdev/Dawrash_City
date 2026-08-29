'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brand } from '@/components/dawrash/brand'
import { cn } from '@/lib/utils'
import { ShieldCheck } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Home' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/profile', label: 'Profile' },
]

export function MemberTopNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  return (
    <div className="hidden items-center gap-1 md:flex">
      {links.map((l) => {
        const active = pathname === l.href
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              active ? 'bg-accent text-gold' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            {l.label}
          </Link>
        )
      })}
      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/admin')
              ? 'bg-accent text-gold'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
        >
          <ShieldCheck className="size-3.5" aria-hidden />
          Admin
        </Link>
      )}
    </div>
  )
}

export function MemberDesktopBrand() {
  return (
    <Link href="/dashboard" aria-label="Dawrash City dashboard">
      <Brand subtitle />
    </Link>
  )
}
