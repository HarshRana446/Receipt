import mongoose, { Schema, Document } from 'mongoose';

export interface ISequence extends Document {
  name: string;
  value: number;
}

const SequenceSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

export default mongoose.models.Sequence || mongoose.model<ISequence>('Sequence', SequenceSchema);
