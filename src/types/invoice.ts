export type InvoiceUnit = 'Pieces' | 'Boxes' | 'Bundles' | 'Sets' | 'Custom';
export type InvoiceStatus = 'Active' | 'Cancelled';

export interface InvoiceItem {
  productId?: string;
  name: string;
  sku: string;
  category: string;
  size: string;
  quantity: number;
  unit: InvoiceUnit;
  rate: number;
  discount: number;
  taxableAmount: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
}

export interface CustomerSnapshot {
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

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  sequenceNumber?: number;
  invoiceDate: string;
  customer: string;
  customerSnapshot: CustomerSnapshot;
  items: InvoiceItem[];
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
  cancelledAt?: string;
  cancelReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoicePayload {
  customerId?: string;
  customerData?: {
    name: string;
    mobile: string;
    email?: string;
    companyName?: string;
    gstin?: string;
    billingAddress: string;
    city: string;
    state: string;
    pincode: string;
  };
  invoiceDate?: string;
  items: Array<{
    productId?: string;
    name: string;
    sku?: string;
    category?: string;
    size?: string;
    quantity: number;
    unit: InvoiceUnit;
    rate: number;
    discount?: number;
    gstPercentage?: number;
  }>;
  additionalDiscount?: number;
  isGstInvoice?: boolean;
  notes?: string;
}

