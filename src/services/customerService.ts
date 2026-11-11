import { api } from './api';
import type { Customer, CustomerInput } from '../types/customer';
import type { Invoice } from '../types/invoice';

export interface CustomersResponse {
  data: Customer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerDetailResponse {
  customer: Customer;
  invoices: Invoice[];
  invoiceCount: number;
  totalBilled: number;
}

export const customerService = {
  async getCustomers(params?: {
    search?: string;
    page?: number;
    limit?: number;
    all?: boolean;
  }): Promise<CustomersResponse> {
    const res = await api.get('/customers', { params });
    return res.data;
  },

  async getCustomerById(id: string): Promise<CustomerDetailResponse> {
    const res = await api.get(`/customers/${id}`);
    return res.data.data;
  },

  async createCustomer(data: CustomerInput): Promise<Customer> {
    const res = await api.post('/customers', data);
    return res.data.data;
  },

  async updateCustomer(id: string, data: Partial<CustomerInput>): Promise<Customer> {
    const res = await api.put(`/customers/${id}`, data);
    return res.data.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};

