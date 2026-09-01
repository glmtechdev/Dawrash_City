'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpCircle, LandPlot, Church } from 'lucide-react'
import { toast } from 'sonner'

import { requestTargetIncrease } from '@/app/actions'
import {
  MAX_PLOTS,
  PRICE_PER_PLOT_KOBO,
  PAYMENT_PER_PERSONAL_PLOT_KOBO,
  formatNaira,
  plotLabel,
} from '@/lib/dawrash-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

interface TargetIncreaseRequestDialogProps {
  currentPlots: number
}

export function TargetIncreaseRequestDialog({ currentPlots }: TargetIncreaseRequestDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [requestedPlots, setRequestedPlots] = useState(currentPlots + 1)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const minRequest = currentPlots + 1
  const totalKobo = requestedPlots * PAYMENT_PER_PERSONAL_PLOT_KOBO
  const personalKobo = requestedPlots * PRICE_PER_PLOT_KOBO

  function increment() {
    setRequestedPlots((p) => p + 1)
  }

  function decrement() {
    setRequestedPlots((p) => Math.max(minRequest, p - 1))
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setRequestedPlots(currentPlots + 1)
      setReason('')
    }
    setOpen(next)
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    const res = await requestTargetIncrease(requestedPlots, reason)
    if (res.success) {
      toast.success('Your request has been submitted. Admin will review it shortly.')
      setOpen(false)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to submit request.')
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-gold/40 text-gold hover:bg-accent hover:text-gold"
          />
        }
      >
        <ArrowUpCircle data-icon="inline-start" />
        Request Increase
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold">Request Target Increase</DialogTitle>
          <DialogDescription>
            You have fully completed your {plotLabel(currentPlots)} target. Choose how many total
            personal plots you'd like and submit for admin review. Each personal plot is paired
            with one church plot at ₦1,000,000 each.
          </DialogDescription>
        </DialogHeader>

        {/* Plot counter */}
        <div className="my-2 rounded-2xl border border-border bg-muted/40 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-serif text-lg font-bold text-foreground">
                {plotLabel(requestedPlots)} personal
              </p>
              <p className="text-sm text-muted-foreground">Total: {formatNaira(totalKobo)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decrement}
                disabled={requestedPlots <= minRequest}
                aria-label="Decrease plots"
                className={
                  requestedPlots <= minRequest
                    ? 'flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground opacity-40'
                    : 'flex size-9 items-center justify-center rounded-full border border-gold text-gold transition-colors hover:bg-gold/10'
                }
              >
                <span className="text-lg font-bold leading-none">−</span>
              </button>
              <span className="w-6 text-center font-serif text-xl font-bold text-foreground">
                {requestedPlots}
              </span>
              <button
                type="button"
                onClick={increment}
                aria-label="Increase plots"
                className="flex size-9 items-center justify-center rounded-full border border-gold text-gold transition-colors hover:bg-gold/10"
              >
                <span className="text-lg font-bold leading-none">+</span>
              </button>
            </div>
          </div>

          {/* Paired breakdown */}
          <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <LandPlot className="size-3.5 text-gold" />
              {plotLabel(requestedPlots)} yours · {formatNaira(personalKobo)}
            </span>
            <span className="flex items-center gap-1">
              <Church className="size-3.5 text-gold" />
              {plotLabel(requestedPlots)} church · {formatNaira(personalKobo)}
            </span>
          </div>

          <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-xs font-medium text-gold">
            Increase from {plotLabel(currentPlots)} → {plotLabel(requestedPlots)} personal plots
          </p>
        </div>

        {/* Optional reason */}
        <div>
          <label htmlFor="increase-reason" className="mb-1.5 block text-sm font-medium text-foreground">
            Reason <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="increase-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Expanding for family members…"
            maxLength={300}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{reason.length}/300</p>
        </div>

        <p className="text-xs text-muted-foreground">
          Your request will be reviewed by an admin. You cannot submit another request while one is pending.
        </p>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="rounded-full" />}>
            Cancel
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-gold text-gold-foreground hover:bg-gold/90 disabled:opacity-50"
          >
            {submitting ? <Spinner className="mr-2 size-4" /> : null}
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
