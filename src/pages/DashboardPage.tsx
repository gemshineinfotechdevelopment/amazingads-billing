import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  FileCheck2,
  Users,
  PlusCircle,
  Eye,
  Calendar,
  Package,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { InvoicePrintView } from '../components/invoice/InvoicePrintView';
import type { DashboardStats } from '../types/report';
import type { Invoice } from '../types/invoice';
import { reportService } from '../services/reportService';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [topPeriod, setTopPeriod] = useState<'month' | 'all'>('month');

  const displayedTopProducts = useMemo(() => {
    if (topPeriod === 'month') {
      return stats?.topSellingProducts || [];
    }
    return stats?.topSellingProductsAllTime || stats?.topSellingProducts || [];
  }, [topPeriod, stats]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await reportService.getDashboardStats();
      setStats(data);
    } catch {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats?.todaySales || 0)}
          subtitle={`${stats?.todayCount || 0} invoices today`}
          icon={DollarSign}
          iconBgColor="bg-blue-50"
          iconColor="text-[#2563EB]"
        />

        <StatCard
          title="Monthly Sales"
          value={formatCurrency(stats?.monthlySales || 0)}
          subtitle={`${stats?.monthCount || 0} orders this month`}
          icon={TrendingUp}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <StatCard
          title="Total Invoices"
          value={stats?.totalInvoices || 0}
          subtitle="All active transactions"
          icon={FileCheck2}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />

        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          subtitle="Registered buyers"
          icon={Users}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* 2. Middle Row: Quick Action & Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Action Box */}
        <div className="bg-gradient-to-br from-[#142B4A] to-[#1e3c66] rounded-xl p-5 sm:p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4" />
              <span>Fast Invoicing</span>
            </div>
            <h3 className="text-lg font-bold">New Calendar Bill</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Generate a tax invoice for wall, desk, or daily calendars with automatic GST calculations.
            </p>
          </div>
          <div className="mt-5 sm:mt-6">
            <Link
              to="/billing/new"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 py-2.5 px-4 bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs rounded-lg transition shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Invoice</span>
            </Link>
          </div>
        </div>

        {/* Top Selling Calendar Products */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 border-b border-slate-100 gap-2">
              <div>
                <h4 className="text-sm font-bold text-[#142B4A] flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#2563EB]" />
                  <span>Top Selling Calendars</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {topPeriod === 'month'
                    ? 'This month sales (Matches Monthly Total)'
                    : 'All-time historical sales'}
                </p>
              </div>

              {/* Period Switcher: This Month vs All Time */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setTopPeriod('month')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    topPeriod === 'month'
                      ? 'bg-white text-[#2563EB] shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setTopPeriod('all')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    topPeriod === 'all'
                      ? 'bg-white text-[#2563EB] shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>

            {displayedTopProducts.length > 0 ? (
              <div className="space-y-2.5">
                {displayedTopProducts.map((p, idx) => {
                  const maxQty = displayedTopProducts[0]?.quantitySold || 1;
                  const pct = Math.min(100, Math.max(8, Math.round((p.quantitySold / maxQty) * 100)));

                  const rankBadges = [
                    'bg-amber-100 text-amber-800 border-amber-300 font-black', // #1 Gold
                    'bg-slate-200 text-slate-800 border-slate-300 font-bold',  // #2 Silver
                    'bg-orange-100 text-orange-800 border-orange-300 font-bold', // #3 Bronze
                    'bg-blue-50 text-blue-700 border-blue-200 font-semibold',  // #4
                    'bg-slate-50 text-slate-600 border-slate-200 font-semibold', // #5
                  ];

                  return (
                    <div
                      key={idx}
                      className="group p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] shrink-0 border ${
                              rankBadges[idx] || rankBadges[4]
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 truncate group-hover:text-[#2563EB] transition" title={p._id}>
                              {p._id}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {p.category || 'Calendar'}
                              {p.size && p.size !== 'Standard' ? ` • ${p.size}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-[#142B4A] font-mono text-xs">
                            {formatCurrency(p.totalRevenue)}
                          </p>
                          <p className="text-[10px] font-bold text-[#2563EB]">
                            {p.quantitySold.toLocaleString('en-IN')} Pcs sold
                          </p>
                        </div>
                      </div>

                      {/* Visual Relative Sales Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#2563EB] h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                <p>
                  {topPeriod === 'month'
                    ? 'No calendars sold this month yet.'
                    : 'No calendar products sold yet.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Products rank automatically when invoices are generated.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Recent Invoices Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#142B4A]">Recent Invoices</h3>
            <p className="text-xs text-slate-500">Latest calendar sales records</p>
          </div>
          <Link
            to="/invoices"
            className="text-xs font-bold text-[#2563EB] hover:text-blue-700 hover:underline"
          >
            View All →
          </Link>
        </div>

        {/* Mobile View: Clean Invoice Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
            stats.recentInvoices.map((inv) => (
              <div key={inv._id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#142B4A] text-xs">
                    {inv.invoiceNumber}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{inv.customerSnapshot.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(inv.invoiceDate)} • {inv.items.length} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(inv.grandTotal)}
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setPreviewInvoice(inv)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>View Bill</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recent invoices found. Create your first calendar bill today!
            </div>
          )}
        </div>

        {/* Desktop View: Full Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
                stats.recentInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#142B4A]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {inv.customerSnapshot.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{inv.items.length} product(s)</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPreviewInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No recent invoices found. Create your first calendar bill today!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePrintView invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
      )}
    </div>
  );
};

