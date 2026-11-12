import mongoose, { Schema, Document, Types } from 'mongoose';

export type InvoiceUnit = 'Pieces' | 'Boxes' | 'Bundles' | 'Sets' | 'Custom';
export type InvoiceStatus = 'Active' | 'Cancelled';

export interface IInvoiceItem {
  productId?: Types.ObjectId;
  name: string;
  sku: string;
  category: string;
  size: string;
  quantity: number;
  unit: InvoiceUnit;
  rate: number;
  discount: number; // item discount in ₹
  taxableAmount: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
}

export interface ICustomerSnapshot {
  name: string;
  mobile: string;
  email?: string;
  companyName?: string;
  gstin?: string;
  billingAddress: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  sequenceNumber?: number;
  invoiceDate: Date;
  customer: Types.ObjectId;
  customerSnapshot: ICustomerSnapshot;
  items: IInvoiceItem[];
  subtotal: number;
  itemDiscountTotal: number;
  additionalDiscount: number;
  taxableAmount: number;
  isGstInvoice: boolean;
  isInterState: boolean;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  roundOff: number;
  grandTotal: number;
  status: InvoiceStatus;
  cancelledAt?: Date;
  cancelReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    category: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: {
      type: String,
      required: true,
      enum: ['Pieces', 'Boxes', 'Bundles', 'Sets', 'Custom'],
      default: 'Pieces',
    },
    rate: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, required: true },
    gstPercentage: { type: Number, default: 12, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

const customerSnapshotSchema = new Schema<ICustomerSnapshot>(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: '' },
    companyName: { type: String, default: '' },
    gstin: { type: String, default: '' },
    billingAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    sequenceNumber: { type: Number, index: true },
    invoiceDate: { type: Date, required: true, default: Date.now },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerSnapshot: { type: customerSnapshotSchema, required: true },
    items: { type: [invoiceItemSchema], required: true },
    subtotal: { type: Number, required: true },
    itemDiscountTotal: { type: Number, default: 0 },
    additionalDiscount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    isGstInvoice: { type: Boolean, default: true },
    isInterState: { type: Boolean, default: false },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalGstAmount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Cancelled'], default: 'Active', index: true },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceDate: -1, status: 1 });
invoiceSchema.index({ 'customerSnapshot.name': 'text', invoiceNumber: 'text' });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);

