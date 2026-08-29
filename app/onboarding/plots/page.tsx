'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/dawrash/onboarding-shell'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { PRICE_PER_PLOT_KOBO, formatNaira, plotLabel } from '@/lib/dawrash-data'
import { savePlotSelection } from '@/app/actions'
import { LandPlot, Check, ArrowRight, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'

const FIXED_OPTIONS = [
  { count: 1, tagline: 'Your foundation' },
  { count: 2, tagline: 'Room to grow' },
]

const MIN_CUSTOM = 3

export default function PlotSelectionPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)
  const [customCount, setCustomCount] = useState(MIN_CUSTOM)
  const [saving, setSaving] = useState(false)

  const isCustomActive = selected !== null && selected >= MIN_CUSTOM

  function selectFixed(count: number) {
    setSelected(count)
  }

  function selectCustom() {
    setSelected(customCount)
  }

  function incrementCustom() {
    const next = customCount + 1
    setCustomCount(next)
    if (isCustomActive) setSelected(next)
  }

  function decrementCustom() {
    if (customCount <= MIN_CUSTOM) return
    const next = customCount - 1
    setCustomCount(next)
    if (isCustomActive) setSelected(next)
  }

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
          {/* Fixed options: 1 and 2 plots */}
          {FIXED_OPTIONS.map((opt) => {
            const total = opt.count * PRICE_PER_PLOT_KOBO
            const active = selected === opt.count
            return (
              <button
                key={opt.count}
                type="button"
                onClick={() => selectFixed(opt.count)}
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

          {/* Custom "More" option */}
          <button
            type="button"
            onClick={selectCustom}
            aria-pressed={isCustomActive}
            className={cn(
              'flex items-center gap-4 rounded-3xl border bg-card p-5 text-left transition-all sm:p-6',
              isCustomActive
                ? 'border-gold bg-accent shadow-md ring-1 ring-gold'
                : 'border-border shadow-sm hover:shadow-md',
            )}
          >
            <span
              className={cn(
                'flex size-14 shrink-0 items-center justify-center rounded-2xl transition-colors',
                isCustomActive ? 'bg-gold text-gold-foreground' : 'bg-accent text-gold',
              )}
            >
              <LandPlot className="size-7" aria-hidden />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <p className="font-serif text-xl font-bold text-foreground">
                  {isCustomActive ? plotLabel(customCount) : 'More Plots'}
                </p>
                <p className="text-lg font-semibold text-gold">
                  {formatNaira(customCount * PRICE_PER_PLOT_KOBO)}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Build your legacy</p>
            </div>
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                isCustomActive ? 'border-gold bg-gold text-gold-foreground' : 'border-border bg-background',
              )}
              aria-hidden
            >
              {isCustomActive ? <Check className="size-4" /> : null}
            </span>
          </button>

          {/* Counter — shown when "More" is active */}
          {isCustomActive && (
            <div className="flex items-center justify-between rounded-2xl border border-gold/40 bg-accent px-5 py-4">
              <p className="text-sm font-medium text-foreground">Number of plots</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={decrementCustom}
                  disabled={customCount <= MIN_CUSTOM}
                  aria-label="Decrease plots"
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full border transition-colors',
                    customCount <= MIN_CUSTOM
                      ? 'border-border text-muted-foreground opacity-40'
                      : 'border-gold text-gold hover:bg-gold/10',
                  )}
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center font-serif text-xl font-bold text-foreground">
                  {customCount}
                </span>
                <button
                  type="button"
                  onClick={incrementCustom}
                  aria-label="Increase plots"
                  className="flex size-9 items-center justify-center rounded-full border border-gold text-gold transition-colors hover:bg-gold/10"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )}
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

