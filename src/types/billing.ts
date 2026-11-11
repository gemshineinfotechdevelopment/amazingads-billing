export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface Invoice {
  id: string;
  clientName: string;
  campaignName: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
}

export interface BillingStats {
  totalBilled: number;
  paidAmount: number;
  pendingAmount: number;
  totalClients: number;
  totalInvoices: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface NewInvoiceInput {
  clientName: string;
  campaignName: string;
  amount: number;
  dueDate?: string;
  status?: InvoiceStatus;
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
}

