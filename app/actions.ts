'use server'

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import Receipt from '@/lib/models/Receipt';
import Expense from '@/lib/models/Expense';
import Sequence from '@/lib/models/Sequence';

// --- SEQUENCE ACTIONS ---

export async function getNextReceiptNumber(): Promise<string> {
  await dbConnect();
  
  const seq = await Sequence.findOneAndUpdate(
    { name: 'receiptNo' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  
  // Format as 3-digit string (e.g., "001", "002")
  return String(seq.value).padStart(3, '0');
}

// --- RECEIPT ACTIONS ---

export async function getReceipts() {
  await dbConnect();
  const receipts = await Receipt.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(receipts.map(r => ({ ...r, _id: r._id?.toString(), id: r._id?.toString() }))));
}

export async function createReceipt(data: any) {
  await dbConnect();
  const receipt = await Receipt.create(data);
  revalidatePath('/');
  return JSON.parse(JSON.stringify({ ...receipt.toObject(), _id: receipt._id.toString(), id: receipt._id.toString() }));
}

export async function updateReceipt(id: string, data: any) {
  await dbConnect();
  const receipt = await Receipt.findByIdAndUpdate(id, data, { new: true }).lean();
  revalidatePath('/');
  return receipt ? JSON.parse(JSON.stringify({ ...receipt, _id: receipt._id?.toString(), id: receipt._id?.toString() })) : null;
}

export async function deleteReceipt(id: string) {
  await dbConnect();
  await Receipt.findByIdAndDelete(id);
  revalidatePath('/');
  return { success: true };
}

// --- EXPENSE ACTIONS ---

export async function getExpenses() {
  await dbConnect();
  const expenses = await Expense.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(expenses.map(e => ({ ...e, _id: e._id?.toString(), id: e._id?.toString() }))));
}

export async function createExpense(data: any) {
  await dbConnect();
  const expense = await Expense.create(data);
  revalidatePath('/');
  return JSON.parse(JSON.stringify({ ...expense.toObject(), _id: expense._id.toString(), id: expense._id.toString() }));
}

export async function updateExpense(id: string, data: any) {
  await dbConnect();
  const expense = await Expense.findByIdAndUpdate(id, data, { new: true }).lean();
  revalidatePath('/');
  return expense ? JSON.parse(JSON.stringify({ ...expense, _id: expense._id?.toString(), id: expense._id?.toString() })) : null;
}

export async function deleteExpense(id: string) {
  await dbConnect();
  await Expense.findByIdAndDelete(id);
  revalidatePath('/');
  return { success: true };
}
