import Image from 'next/image'
import { cn } from '@/lib/utils'

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
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0F1923]">
        <Image
          src="/dawarshIcon.png"
          alt="Dawrash City"
          width={36}
          height={36}
          className="object-contain"
          priority
        />
      </span>
      <div className="leading-tight">
        <p className={cn('font-serif text-lg font-bold tracking-tight', textColor)}>
          DAWRASH <span className="text-gold">CITY</span>
        </p>
        {subtitle ? (
          <p className={cn('text-[11px] font-medium uppercase tracking-[0.18em]', subColor)}>
            Building By Faith
          </p>
        ) : null}
      </div>
    </div>
  )
}
