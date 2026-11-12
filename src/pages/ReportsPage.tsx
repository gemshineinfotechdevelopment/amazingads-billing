import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Package,
  Layers,
  Users,
  RotateCcw,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

type ReportTab = 'daily' | 'monthly' | 'yearly' | 'product' | 'category' | 'customer';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Report Data
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState<any>(null);

  useEffect(() => {
    loadReport();
  }, [activeTab, startDate, endDate]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const dateParams = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      let res: { data: any[]; summary?: any } | null = null;

      if (activeTab === 'daily') {
        res = await reportService.getDailySalesReport(dateParams);
      } else if (activeTab === 'monthly') {
        res = await reportService.getMonthlySalesReport(dateParams);
      } else if (activeTab === 'yearly') {
        res = await reportService.getYearlySalesReport(dateParams);
      } else if (activeTab === 'product') {
        res = await reportService.getProductSalesReport(dateParams);
      } else if (activeTab === 'category') {
        res = await reportService.getCategorySalesReport(dateParams);
      } else if (activeTab === 'customer') {
        res = await reportService.getCustomerSalesReport(dateParams);
      }

      if (res) {
        setReportData(res.data || []);
        setReportSummary(res.summary || null);
      }
    } catch {
      toast.error('Failed to load report data from database');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV / Excel format
  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'daily' || activeTab === 'monthly' || activeTab === 'yearly') {
      csvContent += 'Period,Invoice Count,Taxable Amount (INR),GST Amount (INR),Total Sales (INR)\r\n';
      reportData.forEach((row) => {
        csvContent += `${row._id},${row.invoiceCount || 0},${row.taxableAmount || 0},${row.gstAmount || 0},${row.totalSales || 0}\r\n`;
      });
    } else if (activeTab === 'product') {
      csvContent += 'Product Name,SKU,Category,Size,Quantity Sold,Total Revenue (INR)\r\n';
      reportData.forEach((row) => {
        csvContent += `"${row._id}",${row.sku || '-'},"${row.category}","${row.size}",${row.quantitySold},${row.totalRevenue}\r\n`;
      });
    } else if (activeTab === 'category') {
      csvContent += 'Category,Orders Count,Quantity Sold,Total Revenue (INR)\r\n';
      reportData.forEach((row) => {
        csvContent += `"${row._id}",${row.ordersCount},${row.quantitySold},${row.totalRevenue}\r\n`;
      });
    } else if (activeTab === 'customer') {
      csvContent += 'Customer Name,Company,Mobile,Invoices Count,Taxable (INR),GST (INR),Total Billed (INR)\r\n';
      reportData.forEach((row) => {
        csvContent += `"${row._id}","${row.companyName || ''}",${row.mobile},${row.invoiceCount},${row.taxableAmount},${row.gstAmount},${row.totalSales}\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Calendar_Report_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
            Analytics & Reports
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-[#142B4A]">Sales Performance Reports</h2>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={reportData.length === 0}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Tabs and Date Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          {/* Tab buttons (Horizontally scrollable on mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto shrink-0">
            {[
              { id: 'daily', label: 'Daily Sales', icon: Calendar },
              { id: 'monthly', label: 'Monthly Sales', icon: BarChart3 },
              { id: 'yearly', label: 'Yearly Sales', icon: BarChart3 },
              { id: 'product', label: 'Product-wise', icon: Package },
              { id: 'category', label: 'Category-wise', icon: Layers },
              { id: 'customer', label: 'Customer-wise', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ReportTab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-[#142B4A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Date range picker for filtering */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-200 outline-none"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-200 outline-none"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                title="Reset Date Filters"
                className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-500 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Summary Metric Cards */}
        {reportSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase">Total Sales Turnover</span>
              <p className="text-base sm:text-lg font-black text-[#142B4A] font-mono mt-0.5">
                {formatCurrency(reportSummary.sales ?? reportSummary.totalRevenue ?? 0)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase">
                {activeTab === 'product' || activeTab === 'category' ? 'Total Units Sold' : 'Invoices Count'}
              </span>
              <p className="text-base sm:text-lg font-bold text-slate-800 font-mono mt-0.5">
                {reportSummary.invoices ?? reportSummary.totalQuantity ?? reportSummary.ordersCount ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase">
                {activeTab === 'product' ? 'Unique Products' : activeTab === 'category' ? 'Categories' : 'Taxable Total'}
              </span>
              <p className="text-base sm:text-lg font-bold text-slate-800 font-mono mt-0.5">
                {reportSummary.taxable !== undefined
                  ? formatCurrency(reportSummary.taxable)
                  : (reportSummary.uniqueProducts ?? reportData.length)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase">
                {reportSummary.gst !== undefined ? 'GST Collected' : 'Avg Order Value'}
              </span>
              <p className="text-base sm:text-lg font-bold text-emerald-600 font-mono mt-0.5">
                {reportSummary.gst !== undefined
                  ? formatCurrency(reportSummary.gst)
                  : formatCurrency(
                      reportSummary.totalRevenue && reportSummary.totalQuantity
                        ? Math.round(reportSummary.totalRevenue / Math.max(1, reportSummary.totalQuantity))
                        : 0
                    )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              {activeTab === 'daily' || activeTab === 'monthly' || activeTab === 'yearly' ? (
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-center">Invoices Generated</th>
                  <th className="py-3 px-4 text-right">Taxable Turnover</th>
                  <th className="py-3 px-4 text-right">GST Collected</th>
                  <th className="py-3 px-4 text-right">Total Net Sales</th>
                </tr>
              ) : activeTab === 'product' ? (
                <tr>
                  <th className="py-3 px-4">Calendar Product Name</th>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Total Sales Revenue</th>
                </tr>
              ) : activeTab === 'category' ? (
                <tr>
                  <th className="py-3 px-4">Calendar Category</th>
                  <th className="py-3 px-4 text-center">Order Count</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4 text-center">Invoices Count</th>
                  <th className="py-3 px-4 text-right">Taxable Turnover</th>
                  <th className="py-3 px-4 text-right">GST Paid</th>
                  <th className="py-3 px-4 text-right">Total Net Billed</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Generating sales report from database...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No sales data available in the database for the chosen parameters.
                  </td>
                </tr>
              ) : activeTab === 'daily' || activeTab === 'monthly' || activeTab === 'yearly' ? (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-[#142B4A] font-mono">{row._id}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {row.invoiceCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      {formatCurrency(row.taxableAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-medium">
                      {formatCurrency(row.gstAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(row.totalSales)}
                    </td>
                  </tr>
                ))
              ) : activeTab === 'product' ? (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row._id}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{row.sku || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] text-[11px] font-semibold">
                        {row.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{row.size}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {row.quantitySold}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#142B4A] text-sm">
                      {formatCurrency(row.totalRevenue)}
                    </td>
                  </tr>
                ))
              ) : activeTab === 'category' ? (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row._id}</td>
                    <td className="py-3.5 px-4 text-center text-slate-700 font-semibold">
                      {row.ordersCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {row.quantitySold}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#142B4A] text-sm">
                      {formatCurrency(row.totalRevenue)}
                    </td>
                  </tr>
                ))
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row._id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{row.companyName || '-'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{row.mobile}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{row.invoiceCount}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">{formatCurrency(row.taxableAmount)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-medium">{formatCurrency(row.gstAmount)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#142B4A] text-sm">
                      {formatCurrency(row.totalSales)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
