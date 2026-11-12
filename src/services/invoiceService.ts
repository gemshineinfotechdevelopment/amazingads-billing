import { api } from './api';
import type { Invoice, CreateInvoicePayload } from '../types/invoice';

export interface InvoicesResponse {
  data: Invoice[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const invoiceService = {
  async getInvoices(params?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }): Promise<InvoicesResponse> {
    const res = await api.get('/invoices', { params });
    return res.data;
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    const res = await api.get(`/invoices/${id}`);
    return res.data.data;
  },

  async getNextInvoiceNumber(): Promise<string> {
    const res = await api.get('/invoices/next-number');
    return res.data.data.nextInvoiceNumber;
  },

  async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
    const res = await api.post('/invoices', payload);
    return res.data.data;
  },

  async updateInvoice(id: string, payload: Partial<CreateInvoicePayload>): Promise<Invoice> {
    const res = await api.put(`/invoices/${id}`, payload);
    return res.data.data;
  },

  async cancelInvoice(id: string, reason?: string): Promise<Invoice> {
    const res = await api.patch(`/invoices/${id}/cancel`, { reason });
    return res.data.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },
};

