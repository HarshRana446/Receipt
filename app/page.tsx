import ReceiptApp from "@/components/receipt-app";
import { getExpenses, getReceipts } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  let receipts: any[] = [];
  let expenses: any[] = [];

  try {
    [receipts, expenses] = await Promise.all([getReceipts(), getExpenses()]);
  } catch (e) {
    console.error("Failed to fetch initial data:", e);
  }

  return <ReceiptApp initialReceipts={receipts} initialExpenses={expenses} />;
}
