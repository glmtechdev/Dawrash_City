import Link from 'next/link'
import { BottomNav } from '@/components/dawrash/bottom-nav'
import { MemberTopNav, MemberDesktopBrand } from '@/components/dawrash/member-nav'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'

export function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <MemberDesktopBrand />
          <div className="flex items-center gap-2">
            <MemberTopNav />
            <Button
              render={<Link href="/transactions" aria-label="View payments" />}
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <Bell className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
      <BottomNav />
    </div>
  )
}
