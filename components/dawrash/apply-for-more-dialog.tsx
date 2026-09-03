'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpCircle, LandPlot, Church } from 'lucide-react'
import { toast } from 'sonner'

import { submitPlotApplication, type PlotApplicationInput } from '@/app/actions'
import { PRICE_PER_PLOT_KOBO, PAYMENT_PER_PERSONAL_PLOT_KOBO, formatNaira } from '@/lib/dawrash-data'
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

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
      />
    </div>
  )
}

export function ApplyForMoreDialog({ memberName }: { memberName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<PlotApplicationInput>({
    fullName: memberName,
    phoneNumber: '',
    pastorName: '',
    auxanoCenter: '',
    residentialAddress: '',
    occupation: '',
  })

  function set(field: keyof PlotApplicationInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm({
        fullName: memberName,
        phoneNumber: '',
        pastorName: '',
        auxanoCenter: '',
        residentialAddress: '',
        occupation: '',
      })
    }
    setOpen(next)
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    const res = await submitPlotApplication(form)
    if (res.success) {
      toast.success('Application submitted. Admin will review it and get back to you.')
      setOpen(false)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to submit application. Please try again.')
      setSubmitting(false)
    }
  }

  const allFilled = Object.values(form).every((v) => v.trim().length > 0)

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
        Apply for More
      </DialogTrigger>

      <DialogContent className="flex max-h-[90svh] flex-col sm:max-w-md">
        {/* Pinned header */}
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-serif text-lg font-bold">Apply for a Second Plot</DialogTitle>
          <DialogDescription>
            You have completed full payment for your first plot. Fill in the form below and an admin will review your application.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
          {/* What you're applying for */}
          <div className="rounded-2xl border border-gold/25 bg-gold/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Applying for</p>
            <p className="mt-1 font-serif text-lg font-bold text-foreground">2 Personal Plots total</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <LandPlot className="size-3.5 text-gold" />
                2 plots yours · {formatNaira(2 * PRICE_PER_PLOT_KOBO)}
              </span>
              <span className="flex items-center gap-1">
                <Church className="size-3.5 text-gold" />
                2 plots church · {formatNaira(2 * PRICE_PER_PLOT_KOBO)}
              </span>
            </div>
            <p className="mt-1.5 font-semibold text-gold">
              Total commitment: {formatNaira(2 * PAYMENT_PER_PERSONAL_PLOT_KOBO)}
            </p>
          </div>

          {/* Form fields */}
          <div className="mt-4 grid gap-3">
            <Field
              id="af-fullname"
              label="Full Name"
              value={form.fullName}
              onChange={(v) => set('fullName', v)}
              placeholder="Your full name"
            />
            <Field
              id="af-phone"
              label="Phone Number"
              value={form.phoneNumber}
              onChange={(v) => set('phoneNumber', v)}
              placeholder="e.g. 08012345678"
              type="tel"
            />
            <Field
              id="af-pastor"
              label="Pastor's Name"
              value={form.pastorName}
              onChange={(v) => set('pastorName', v)}
              placeholder="Your pastor's full name"
            />
            <Field
              id="af-auxano"
              label="Auxano Center"
              value={form.auxanoCenter}
              onChange={(v) => set('auxanoCenter', v)}
              placeholder="Your cell or home unit name"
            />
            <Field
              id="af-address"
              label="Residential Address"
              value={form.residentialAddress}
              onChange={(v) => set('residentialAddress', v)}
              placeholder="Your home address"
            />
            <Field
              id="af-occupation"
              label="Occupation"
              value={form.occupation}
              onChange={(v) => set('occupation', v)}
              placeholder="Your occupation"
            />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            You cannot submit another application while one is pending review.
          </p>
        </div>

        {/* Pinned footer */}
        <DialogFooter className="shrink-0 border-t border-border pt-4">
          <DialogClose render={<Button variant="outline" className="rounded-full" />}>
            Cancel
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!allFilled || submitting}
            className="rounded-full bg-gold text-gold-foreground hover:bg-gold/90 disabled:opacity-50"
          >
            {submitting ? <Spinner className="mr-2 size-4" /> : null}
            {submitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
