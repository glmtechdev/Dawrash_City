import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PaymentStatus, MemberStatus } from '@/lib/dawrash-data'

const paymentStyles: Record<PaymentStatus, string> = {
  confirmed: 'border-transparent bg-success/12 text-success',
  pending: 'border-transparent bg-warning/15 text-warning',
  failed: 'border-transparent bg-destructive/12 text-destructive',
}

const paymentText: Record<PaymentStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  failed: 'Failed',
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', paymentStyles[status])}>
      {paymentText[status]}
    </Badge>
  )
}

const memberStyles: Record<MemberStatus, string> = {
  active: 'border-transparent bg-gold/12 text-gold',
  completed: 'border-transparent bg-success/12 text-success',
  pending_covenant: 'border-transparent bg-warning/15 text-warning',
}

const memberText: Record<MemberStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  pending_covenant: 'Pending Covenant',
}

export function MemberBadge({ status }: { status: MemberStatus }) {
  return (
    <Badge className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', memberStyles[status])}>
      {memberText[status]}
    </Badge>
  )
}
