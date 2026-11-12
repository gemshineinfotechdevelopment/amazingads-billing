import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanySettings extends Document {
  companyName: string;
  logoUrl?: string;
  address: string;
  mobile: string;
  email: string;
  gstin: string;
  state: string;
  pincode: string;
  invoicePrefix: string;
  startingNumber: number;
  financialYear: string;
  currency: string;
  defaultGstRate: number;
  invoiceFooterText?: string;
  termsAndConditions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const companySettingsSchema = new Schema<ICompanySettings>(
  {
    companyName: { type: String, required: true, default: 'Amazing Ads' },
    logoUrl: { type: String, default: '' },
    address: { type: String, required: true, default: '124, Sivakasi Road, Printing Cluster' },
    mobile: { type: String, required: true, default: '+91 98765 43210' },
    email: { type: String, required: true, default: 'orders@amazingads.com' },
    gstin: { type: String, default: '33AABCS1429B1Z8' },
    state: { type: String, required: true, default: 'Tamil Nadu' },
    pincode: { type: String, required: true, default: '626123' },
    invoicePrefix: { type: String, required: true, default: 'CAL' },
    startingNumber: { type: Number, required: true, default: 1 },
    financialYear: { type: String, required: true, default: '2026-27' },
    currency: { type: String, default: 'INR' },
    defaultGstRate: { type: Number, default: 12 },
    invoiceFooterText: {
      type: String,
      default: 'Thank you for choosing Amazing Ads! Premium quality delivered on time.',
    },
    termsAndConditions: {
      type: String,
      default:
        '1. Goods once sold will not be taken back or exchanged.\n2. All printing proof designs approved by customer are final.\n3. Disputed matters are subject to Sivakasi Jurisdiction only.\n4. Interest @ 18% p.a. will be charged for delayed settlements.',
    },
  },
  { timestamps: true }
);

export const CompanySettings = mongoose.model<ICompanySettings>(
  'CompanySettings',
  companySettingsSchema
);

