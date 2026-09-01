'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/dawrash/onboarding-shell'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  PLOT_OPTIONS,
  PRICE_PER_PLOT_KOBO,
  PAYMENT_PER_PERSONAL_PLOT_KOBO,
  MAX_PLOTS,
  formatNaira,
  plotLabel,
} from '@/lib/dawrash-data'
import { savePlotSelection } from '@/app/actions'
import { LandPlot, Church, Check, ArrowRight } from 'lucide-react'
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
          Select how many personal plots you want in Dawrash City. Each personal plot you buy
          includes a matching church-building plot, both funded by you at{' '}
          <span className="font-semibold text-foreground">₦1,000,000 each</span>.
        </p>

        {/* Pricing explainer */}
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4 sm:grid-cols-3">
          <div className="text-center">
            <LandPlot className="mx-auto size-5 text-gold" />
            <p className="mt-1 text-xs font-semibold text-foreground">Your plot</p>
            <p className="text-xs text-muted-foreground">₦1,000,000</p>
          </div>
          <div className="text-center">
            <Church className="mx-auto size-5 text-gold" />
            <p className="mt-1 text-xs font-semibold text-foreground">Church plot</p>
            <p className="text-xs text-muted-foreground">₦1,000,000</p>
          </div>
          <div className="col-span-2 text-center sm:col-span-1">
            <p className="text-xs font-semibold text-foreground">Total per personal plot</p>
            <p className="mt-0.5 font-serif text-base font-bold text-gold">₦2,000,000</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {PLOT_OPTIONS.map((opt) => {
            const personalKobo = opt.count * PRICE_PER_PLOT_KOBO
            const totalKobo = opt.count * PAYMENT_PER_PERSONAL_PLOT_KOBO
            const active = selected === opt.count
            return (
              <button
                key={opt.count}
                type="button"
                onClick={() => setSelected(opt.count)}
                aria-pressed={active}
                className={cn(
                  'flex items-start gap-4 rounded-3xl border bg-card p-5 text-left transition-all sm:p-6',
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
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <p className="font-serif text-xl font-bold text-foreground">
                      {plotLabel(opt.count)} personal
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{opt.tagline}</p>
                  {/* Paired breakdown */}
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <LandPlot className="size-3.5 text-gold" />
                      {plotLabel(opt.count)} yours · {formatNaira(personalKobo)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Church className="size-3.5 text-gold" />
                      {plotLabel(opt.count)} church · {formatNaira(personalKobo)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-semibold text-gold">
                    Total: {formatNaira(totalKobo)}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                    active ? 'border-gold bg-gold text-gold-foreground' : 'border-border bg-background',
                  )}
                  aria-hidden
                >
                  {active && <Check className="size-4" />}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-6 rounded-2xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
          Need more than {MAX_PLOTS} personal plots? You can apply for a target increase once you have fully completed payment for your current allocation.
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
              Saving selection…
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
