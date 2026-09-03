import Link from 'next/link'
import { Brand } from '@/components/dawrash/brand'

export function OnboardingShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-[100svh] flex-col bg-background">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="Dawrash City home">
          <Brand subtitle />
        </Link>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16 pt-4">{children}</div>
    </main>
  )
}
