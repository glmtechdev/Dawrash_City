import { cn } from '@/lib/utils'
import { Home } from 'lucide-react'

export function Brand({
  className,
  subtitle = false,
  tone = 'dark',
}: {
  className?: string
  subtitle?: boolean
  tone?: 'dark' | 'light'
}) {
  const textColor = tone === 'light' ? 'text-navy-foreground' : 'text-foreground'
  const subColor = tone === 'light' ? 'text-navy-foreground/60' : 'text-muted-foreground'
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-gold text-gold-foreground">
        <Home className="size-5" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className={cn('font-serif text-lg font-bold tracking-tight', textColor)}>
          DAWRASH <span className="text-gold">CITY</span>
        </p>
        {subtitle ? (
          <p className={cn('text-[11px] font-medium uppercase tracking-[0.18em]', subColor)}>
            Community Land Savings
          </p>
        ) : null}
      </div>
    </div>
  )
}
