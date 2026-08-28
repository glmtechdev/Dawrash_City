import Link from 'next/link'
import { Brand } from '@/components/dawrash/brand'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export function OnboardingShell({
  step,
  children,
}: {
  step: 1 | 2
  children: React.ReactNode
}) {
  const steps = [
    { n: 1, label: 'Plots' },
    { n: 2, label: 'Covenant' },
  ]
  return (
    <main className="flex min-h-[100svh] flex-col bg-background">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="Dawrash City home">
          <Brand subtitle />
        </Link>
        <ol className="flex items-center gap-2">
          {steps.map((s, i) => {
            const done = s.n < step
            const active = s.n === step
            return (
              <li key={s.n} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    done && 'bg-gold text-gold-foreground',
                    active && 'bg-gold text-gold-foreground',
                    !done && !active && 'border border-border bg-card text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden /> : s.n}
                </span>
                <span
                  className={cn(
                    'hidden text-sm font-medium sm:inline',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </span>
                {i === 0 ? <span className="mx-1 h-px w-6 bg-border" aria-hidden /> : null}
              </li>
            )
          })}
        </ol>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16 pt-4">{children}</div>
    </main>
  )
}
