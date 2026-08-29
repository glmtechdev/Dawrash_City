import { getCurrentMemberServer } from '@/lib/member-data'
import { TransactionsContent } from '@/components/dawrash/transactions-content'
import { MemberLayout } from '@/components/dawrash/member-layout'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const member = await getCurrentMemberServer()
  return (
    <MemberLayout>
      <TransactionsContent member={member} />
    </MemberLayout>
  )
}
