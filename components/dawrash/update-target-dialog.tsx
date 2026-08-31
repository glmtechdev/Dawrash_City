'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LandPlot, Minus, Plus, Target } from 'lucide-react'
import { toast } from 'sonner'

import { updateTarget } from '@/app/actions'
import { PRICE_PER_PLOT_KOBO, formatNaira, plotLabel } from '@/lib/dawrash-data'
import { cn } from '@/lib/utils'
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

interface UpdateTargetDialogProps {
  currentPlots: number
  /** Minimum selectable plots - cannot go below confirmed-paid plots */
  minPlots?: number
}

export function UpdateTargetDialog({
  currentPlots,
  minPlots = 1,
}: UpdateTargetDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [plots, setPlots] = useState(currentPlots)
  const [saving, setSaving] = useState(false)

  const hasChanged = plots !== currentPlots
  const totalKobo = plots * PRICE_PER_PLOT_KOBO

  function increment() {
    setPlots((p) => p + 1)
  }

  function decrement() {
    setPlots((p) => Math.max(minPlots, p - 1))
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset to current value when dismissed
      setPlots(currentPlots)
    }
    setOpen(next)
  }

  async function handleSave() {
    if (!hasChanged || saving) return
    setSaving(true)

    const res = await updateTarget(plots)

    if (res.success) {
      toast.success('Target updated successfully.')
      setOpen(false)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update target.')
      setSaving(false)
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
        <Target data-icon="inline-start" />
        Update Target
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold">Update Your Land Target</DialogTitle>
          <DialogDescription>
            Adjust the number of plots you want to own in Dawrash City. Your target amount will update accordingly.
          </DialogDescription>
        </DialogHeader>

        {/* Plot counter */}
        <div className="my-2 rounded-2xl border border-border bg-muted/40 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <LandPlot className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-serif text-lg font-bold text-foreground">{plotLabel(plots)}</p>
                <p className="text-sm text-muted-foreground">{formatNaira(totalKobo)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decrement}
                disabled={plots <= minPlots}
                aria-label="Decrease plots"
                className={cn(
                  'flex size-9 items-center justify-center rounded-full border transition-colors',
                  plots <= minPlots
                    ? 'border-border text-muted-foreground opacity-40'
                    : 'border-gold text-gold hover:bg-gold/10',
                )}
              >
                <Minus className="size-4" />
              </button>

              <span className="w-6 text-center font-serif text-xl font-bold text-foreground">
                {plots}
              </span>

              <button
                type="button"
                onClick={increment}
                aria-label="Increase plots"
                className="flex size-9 items-center justify-center rounded-full border border-gold text-gold transition-colors hover:bg-gold/10"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Change indicator */}
          {hasChanged && (
            <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-xs font-medium text-gold">
              Changing from {plotLabel(currentPlots)} ({formatNaira(currentPlots * PRICE_PER_PLOT_KOBO)}) →{' '}
              {plotLabel(plots)} ({formatNaira(totalKobo)})
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          You cannot set a target below the plots you have already paid for.
        </p>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" className="rounded-full" />}
          >
            Cancel
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={!hasChanged || saving}
            className="rounded-full bg-gold text-gold-foreground hover:bg-gold/90 disabled:opacity-50"
          >
            {saving ? <Spinner className="mr-2 size-4" /> : null}
            {saving ? 'Saving…' : 'Save Target'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
