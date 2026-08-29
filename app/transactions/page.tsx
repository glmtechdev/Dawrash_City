import { getCurrentMemberServer } from '@/lib/member-data'
import { TransactionsContent } from '@/components/dawrash/transactions-content'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {

  const member = await getCurrentMemberServer()
  return <TransactionsContent member={member} />
}
