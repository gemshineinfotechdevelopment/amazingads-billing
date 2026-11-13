import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Today's sales
    const todayInvoices = await Invoice.find({
      status: 'Active',
      invoiceDate: { $gte: startOfToday },
    });
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    // 2. Monthly sales
    const monthInvoices = await Invoice.find({
      status: 'Active',
      invoiceDate: { $gte: startOfMonth },
    });
    const monthlySales = monthInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    // 3. Total active invoices & Total customers
    const [totalInvoices, totalCustomers] = await Promise.all([
      Invoice.countDocuments({ status: 'Active' }),
      Customer.countDocuments(),
    ]);

    // 4. Recent invoices (latest 5)
    const recentInvoices = await Invoice.find()
      .sort({ invoiceDate: -1, createdAt: -1 })
      .limit(5);

    // 5. Monthly Sales Chart (Last 6 Months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyChartAgg = await Invoice.aggregate([
      {
        $match: {
          status: 'Active',
          invoiceDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' },
          },
          totalSales: { $sum: '$grandTotal' },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyChart = monthlyChartAgg.map((item) => ({
      label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      sales: item.totalSales,
      count: item.invoiceCount,
    }));

    // 6. Top Selling Calendar Products (Processed by Quantity Sold & Revenue)
    const topProductsAgg = await Invoice.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $match: {
          'items.name': { $exists: true, $nin: ['', null] },
        },
      },
      {
        $project: {
          name: { $trim: { input: '$items.name' } },
          category: '$items.category',
          size: '$items.size',
          quantity: { $ifNull: ['$items.quantity', 1] },
          totalAmount: { $ifNull: ['$items.totalAmount', 0] },
        },
      },
      {
        $group: {
          _id: '$name',
          category: { $first: '$category' },
          size: { $first: '$size' },
          quantitySold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { quantitySold: -1, totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: {
        todaySales,
        todayCount: todayInvoices.length,
        monthlySales,
        monthCount: monthInvoices.length,
        totalInvoices,
        totalCustomers,
        recentInvoices,
        monthlyChart,
        topSellingProducts: topProductsAgg,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDailySalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const match: any = { status: 'Active' };
    if (startDate || endDate) {
      match.invoiceDate = {};
      if (startDate) match.invoiceDate.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        match.invoiceDate.$lte = end;
      }
    }

    const report = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$invoiceDate' } },
          invoiceCount: { $sum: 1 },
          taxableAmount: { $sum: '$taxableAmount' },
          gstAmount: { $sum: '$totalGstAmount' },
          totalSales: { $sum: '$grandTotal' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const totals = report.reduce(
      (acc, cur) => ({
        invoices: acc.invoices + cur.invoiceCount,
        taxable: acc.taxable + cur.taxableAmount,
        gst: acc.gst + cur.gstAmount,
        sales: acc.sales + cur.totalSales,
      }),
      { invoices: 0, taxable: 0, gst: 0, sales: 0 }
    );

    res.json({ success: true, data: report, summary: totals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlySalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const match: any = { status: 'Active' };
    if (startDate || endDate) {
      match.invoiceDate = {};
      if (startDate) match.invoiceDate.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        match.invoiceDate.$lte = end;
      }
    }

    const report = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$invoiceDate' } },
          invoiceCount: { $sum: 1 },
          taxableAmount: { $sum: '$taxableAmount' },
          gstAmount: { $sum: '$totalGstAmount' },
          totalSales: { $sum: '$grandTotal' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const totals = report.reduce(
      (acc, cur) => ({
        invoices: acc.invoices + cur.invoiceCount,
        taxable: acc.taxable + cur.taxableAmount,
        gst: acc.gst + cur.gstAmount,
        sales: acc.sales + cur.totalSales,
      }),
      { invoices: 0, taxable: 0, gst: 0, sales: 0 }
    );

    res.json({ success: true, data: report, summary: totals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getYearlySalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const match: any = { status: 'Active' };
    if (startDate || endDate) {
      match.invoiceDate = {};
      if (startDate) match.invoiceDate.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        match.invoiceDate.$lte = end;
      }
    }

    const report = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y', date: '$invoiceDate' } },
          invoiceCount: { $sum: 1 },
          taxableAmount: { $sum: '$taxableAmount' },
          gstAmount: { $sum: '$totalGstAmount' },
          totalSales: { $sum: '$grandTotal' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const totals = report.reduce(
      (acc, cur) => ({
        invoices: acc.invoices + cur.invoiceCount,
        taxable: acc.taxable + cur.taxableAmount,
        gst: acc.gst + cur.gstAmount,
        sales: acc.sales + cur.totalSales,
      }),
      { invoices: 0, taxable: 0, gst: 0, sales: 0 }
    );

    res.json({ success: true, data: report, summary: totals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const match: any = { status: 'Active' };
    if (startDate || endDate) {
      match.invoiceDate = {};
      if (startDate) match.invoiceDate.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        match.invoiceDate.$lte = end;
      }
    }

    const report = await Invoice.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          sku: { $first: '$items.sku' },
          category: { $first: '$items.category' },
          size: { $first: '$items.size' },
          quantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalAmount' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    const totalRevenue = report.reduce((sum, r) => sum + r.totalRevenue, 0);
    const totalQuantity = report.reduce((sum, r) => sum + r.quantitySold, 0);

    res.json({
      success: true,
      data: report,
      summary: { totalRevenue, totalQuantity, uniqueProducts: report.length },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategorySalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const match: any = { status: 'Active' };
    if (startDate || endDate) {
      match.invoiceDate = {};
      if (startDate) match.invoiceDate.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        match.invoiceDate.$lte = end;
      }
    }

    const report = await Invoice.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          quantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalAmount' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    const totalRevenue = report.reduce((sum, r) => sum + r.totalRevenue, 0);
    const totalQuantity = report.reduce((sum, r) => sum + r.quantitySold, 0);
    const totalOrders = report.reduce((sum, r) => sum + r.ordersCount, 0);

    res.json({
      success: true,
      data: report,
      summary: {
        totalRevenue,
        sales: totalRevenue,
        totalQuantity,
        ordersCount: totalOrders,
        invoices: totalOrders,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const match: any = { status: 'Active' };
    if (startDate || endDate) {
      match.invoiceDate = {};
      if (startDate) match.invoiceDate.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        match.invoiceDate.$lte = end;
      }
    }

    const report = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$customerSnapshot.name',
          companyName: { $first: '$customerSnapshot.companyName' },
          mobile: { $first: '$customerSnapshot.mobile' },
          city: { $first: '$customerSnapshot.city' },
          invoiceCount: { $sum: 1 },
          taxableAmount: { $sum: '$taxableAmount' },
          gstAmount: { $sum: '$totalGstAmount' },
          totalSales: { $sum: '$grandTotal' },
          lastOrderDate: { $max: '$invoiceDate' },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    const totals = report.reduce(
      (acc, cur) => ({
        invoices: acc.invoices + cur.invoiceCount,
        taxable: acc.taxable + cur.taxableAmount,
        gst: acc.gst + cur.gstAmount,
        sales: acc.sales + cur.totalSales,
      }),
      { invoices: 0, taxable: 0, gst: 0, sales: 0 }
    );

    res.json({ success: true, data: report, summary: totals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

