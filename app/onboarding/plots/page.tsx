'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/dawrash/onboarding-shell'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { PLOT_OPTIONS, PRICE_PER_PLOT_KOBO, formatNaira, plotLabel } from '@/lib/dawrash-data'
import { savePlotSelection } from '@/app/actions'
import { LandPlot, Check, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function PlotSelectionPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleContinue() {
    if (selected === null || saving) return
    setSaving(true)

    const res = await savePlotSelection(selected)
    if (res.success) {
      router.push('/onboarding/covenant')
    } else {
      toast.error(res.error || 'Failed to save plot selection')
      setSaving(false)
    }
  }

  return (
    <OnboardingShell step={1}>
      <div className="pt-6">
        <h1 className="text-balance font-serif text-3xl font-bold text-foreground md:text-4xl">
          Choose Your Plots
        </h1>
        <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
          Select how many plots of land you want to own in Dawrash City. Each plot is a surveyed parcel
          reserved in your name.
        </p>

        <div className="mt-8 grid gap-4">
          {PLOT_OPTIONS.map((opt) => {
            const total = opt.count * PRICE_PER_PLOT_KOBO
            const active = selected === opt.count
            return (
              <button
                key={opt.count}
                type="button"
                onClick={() => setSelected(opt.count)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-4 rounded-3xl border bg-card p-5 text-left transition-all sm:p-6',
                  active
                    ? 'border-gold bg-accent shadow-md ring-1 ring-gold'
                    : 'border-border shadow-sm hover:shadow-md',
                )}
              >
                <span
                  className={cn(
                    'flex size-14 shrink-0 items-center justify-center rounded-2xl transition-colors',
                    active ? 'bg-gold text-gold-foreground' : 'bg-accent text-gold',
                  )}
                >
                  <LandPlot className="size-7" aria-hidden />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <p className="font-serif text-xl font-bold text-foreground">{plotLabel(opt.count)}</p>
                    <p className="text-lg font-semibold text-gold">{formatNaira(total)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{opt.tagline}</p>
                </div>
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                    active ? 'border-gold bg-gold text-gold-foreground' : 'border-border bg-background',
                  )}
                  aria-hidden
                >
                  {active ? <Check className="size-4" /> : null}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-6 rounded-2xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
          Your target will be locked at this amount and cannot be changed later.
        </p>

        <Button
          size="lg"
          disabled={selected === null || saving}
          onClick={handleContinue}
          className="mt-6 h-12 w-full rounded-full bg-gold text-base text-gold-foreground hover:bg-gold/90 sm:w-auto sm:px-10"
        >
          {saving ? (
            <>
              <Spinner data-icon="inline-start" />
              Saving selection...
            </>
          ) : (
            <>
              Continue
              <ArrowRight data-icon="inline-end" />
            </>
          )}
        </Button>
      </div>
    </OnboardingShell>
  )
}

