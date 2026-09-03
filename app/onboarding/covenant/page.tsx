'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/dawrash/onboarding-shell'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { COVENANT_TEXT, formatNaira, PAYMENT_PER_PERSONAL_PLOT_KOBO } from '@/lib/dawrash-data'
import { acceptCovenant } from '@/app/actions'
import { ArrowRight, LandPlot, ScrollText } from 'lucide-react'
import { toast } from 'sonner'

export default function CovenantPage() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const paragraphs = COVENANT_TEXT.split('\n\n')

  async function handleAccept() {
    if (!accepted || submitting) return
    setSubmitting(true)

    const res = await acceptCovenant()
    if (res.success) {
      router.push('/dashboard')
    } else {
      toast.error(res.error || 'Failed to record covenant acceptance')
      setSubmitting(false)
    }
  }

  return (
    <OnboardingShell>
      <div className="pt-6">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-gold">
          <ScrollText className="size-6" aria-hidden />
        </span>

        <h1 className="mt-6 text-balance font-serif text-3xl font-bold text-foreground md:text-4xl">
          The Dawrash Covenant
        </h1>
        <div className="mt-4 h-1 w-24 rounded-full bg-gold" aria-hidden />

        {/* Plot assignment notice */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <LandPlot className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">1 personal plot reserved for you</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your total payment commitment is {formatNaira(PAYMENT_PER_PERSONAL_PLOT_KOBO)} (1 personal plot + 1 church plot at N1,000,000 each). Save at your own pace with no deadlines.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <ScrollArea className="h-72 p-5">
            <div className="flex flex-col gap-4 pr-3">
              {paragraphs.map((p, i) => {
                const [firstLine, ...rest] = p.split('\n')
                const isHeading = i === 0
                if (isHeading) {
                  return (
                    <p key={i} className="font-serif text-lg font-bold text-foreground">
                      {p}
                    </p>
                  )
                }
                return (
                  <div key={i}>
                    <p className="font-semibold text-foreground">{firstLine}</p>
                    {rest.length ? (
                      <p className="mt-1 leading-relaxed text-muted-foreground">{rest.join(' ')}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-warning/50 bg-warning/10 p-4 shadow-sm transition-colors hover:bg-warning/15">
          <Checkbox
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            required
            aria-required="true"
            className="mt-0.5 border-warning bg-card text-warning data-[state=checked]:border-warning data-[state=checked]:bg-warning data-[state=checked]:text-white"
          />
          <span className="text-sm font-medium text-foreground">
            I have read and I irrevocably accept this covenant.
          </span>
        </label>
        <p className="mt-3 text-xs text-muted-foreground">
          Your acceptance will be recorded with a timestamp.
        </p>

        <Button
          size="lg"
          disabled={!accepted || submitting}
          onClick={handleAccept}
          className="mt-6 h-12 w-full rounded-full bg-gold text-base text-gold-foreground hover:bg-gold/90 sm:w-auto sm:px-10"
        >
          {submitting ? (
            <>
              <Spinner data-icon="inline-start" />
              Recording acceptance...
            </>
          ) : (
            <>
              I Accept &amp; Continue
              <ArrowRight data-icon="inline-end" />
            </>
          )}
        </Button>
      </div>
    </OnboardingShell>
  )
}
