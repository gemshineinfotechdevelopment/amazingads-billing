import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceCounter extends Document {
  identifier: string; // e.g., 'INV-2026-27'
  seq: number;
}

const invoiceCounterSchema = new Schema<IInvoiceCounter>(
  {
    identifier: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const InvoiceCounter = mongoose.model<IInvoiceCounter>(
  'InvoiceCounter',
  invoiceCounterSchema
);

