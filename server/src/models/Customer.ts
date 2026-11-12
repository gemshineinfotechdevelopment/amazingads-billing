import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  mobile: string;
  email?: string;
  companyName?: string;
  gstin?: string;
  billingAddress: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    gstin: { type: String, trim: true, uppercase: true, default: '' },
    billingAddress: { type: String, trim: true, default: 'Direct Counter' },
    city: { type: String, trim: true, default: 'Sivakasi' },
    state: { type: String, trim: true, default: 'Tamil Nadu' },
    pincode: { type: String, trim: true, default: '626123' },
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', mobile: 'text', companyName: 'text' });
customerSchema.index({ mobile: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);

