import { getReceipts, getExpenses } from './actions'
import ReceiptApp from '@/components/receipt-app'

export const dynamic = 'force-dynamic'

export default async function Page() {
  let receipts: any[] = []
  let expenses: any[] = []

  try {
    ;[receipts, expenses] = await Promise.all([getReceipts(), getExpenses()])
  } catch (e) {
    // DB error - app still loads with empty state
    console.error('Failed to fetch initial data:', e)
  }

  return <ReceiptApp initialReceipts={receipts} initialExpenses={expenses} />
}
