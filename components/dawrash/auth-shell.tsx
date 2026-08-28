import Link from 'next/link'
import { Brand } from '@/components/dawrash/brand'

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[100svh] flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="Dawrash City home">
          <Brand subtitle />
        </Link>
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  )
}
