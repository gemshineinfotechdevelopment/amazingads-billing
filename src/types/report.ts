import type { Invoice } from './invoice';

export interface DashboardStats {
  todaySales: number;
  todayCount: number;
  monthlySales: number;
  monthCount: number;
  totalInvoices: number;
  totalCustomers: number;
  recentInvoices: Invoice[];
  monthlyChart: Array<{
    label: string;
    sales: number;
    count: number;
  }>;
  topSellingProducts: Array<{
    _id: string;
    category?: string;
    size?: string;
    quantitySold: number;
    totalRevenue: number;
    orderCount?: number;
  }>;
}

export interface DailySalesReportItem {
  _id: string;
  invoiceCount: number;
  taxableAmount: number;
  gstAmount: number;
  totalSales: number;
}

export interface ProductSalesReportItem {
  _id: string;
  sku: string;
  category: string;
  size: string;
  quantitySold: number;
  totalRevenue: number;
}

