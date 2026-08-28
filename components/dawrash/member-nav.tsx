'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brand } from '@/components/dawrash/brand'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Home' },
  { href: '/transactions', label: 'Payments' },
  { href: '/profile', label: 'Profile' },
]

export function MemberTopNav() {
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
