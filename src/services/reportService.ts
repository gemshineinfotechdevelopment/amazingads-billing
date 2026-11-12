import { api } from './api';
import type { DashboardStats, DailySalesReportItem, ProductSalesReportItem } from '../types/report';

export const reportService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await api.get('/reports/dashboard');
    return res.data.data;
  },

  async getDailySalesReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: DailySalesReportItem[]; summary: any }> {
    const res = await api.get('/reports/daily-sales', { params });
    return res.data;
  },

  async getMonthlySalesReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: any[]; summary: any }> {
    const res = await api.get('/reports/monthly-sales', { params });
    return res.data;
  },

  async getYearlySalesReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: any[]; summary: any }> {
    const res = await api.get('/reports/yearly-sales', { params });
    return res.data;
  },

  async getProductSalesReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: ProductSalesReportItem[]; summary: any }> {
    const res = await api.get('/reports/product-sales', { params });
    return res.data;
  },

  async getCategorySalesReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: any[]; summary: any }> {
    const res = await api.get('/reports/category-sales', { params });
    return res.data;
  },

  async getCustomerSalesReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: any[]; summary: any }> {
    const res = await api.get('/reports/customer-sales', { params });
    return res.data;
  },
};

