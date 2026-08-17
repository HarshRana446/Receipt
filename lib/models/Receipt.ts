import mongoose, { Schema, Document } from 'mongoose';

export interface IReceipt extends Document {
  receiptNo: string;
  houseNo: string;
  amount: number;
  paymentMethod: 'Cash' | 'Online';
  date: string;
}

const ReceiptSchema: Schema = new Schema(
  {
    receiptNo: { type: String, required: true, unique: true },
    houseNo: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Online'], required: true },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema);
