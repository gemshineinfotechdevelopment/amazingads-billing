import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Download,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { InvoicePrintView } from '../components/invoice/InvoicePrintView';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { Pagination } from '../components/common/Pagination';
import type { Invoice } from '../types/invoice';
import { invoiceService } from '../services/invoiceService';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

export const AllInvoicesPage: React.FC = () => {
  const { settings } = useSettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Modals
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [search, statusFilter, startDate, endDate, page]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceService.getInvoices({
        search,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: pageSize,
      });

      setInvoices(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalItems(res.pagination.total);
      }
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!cancellingInvoice) return;
    try {
      await invoiceService.cancelInvoice(cancellingInvoice._id, 'Cancelled via Invoice Directory');
      toast.success(`Invoice ${cancellingInvoice.invoiceNumber} has been cancelled.`);
      loadInvoices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel invoice');
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    generateInvoicePDF(invoice, settings || undefined);
    toast.success(`Downloaded PDF for ${invoice.invoiceNumber}`);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
            Sales Ledger
          </span>
          <h2 className="text-xl font-bold text-[#142B4A]">All Calendar Invoices</h2>
        </div>
        <div className="text-xs font-medium text-slate-500">
          Total Recorded: <span className="font-bold text-slate-900">{totalItems}</span> invoices
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice #, customer, mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Invoices Only</option>
              <option value="Cancelled">Cancelled Invoices Only</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div className="relative">
            <input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          {/* Date Range End */}
          <div className="flex gap-2">
            <input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
            <button
              onClick={resetFilters}
              title="Reset Filters"
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Mobile View: Clean Invoice Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading calendar invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No invoices found matching your filter criteria.
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv._id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#142B4A] text-sm">
                    {inv.invoiceNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatDate(inv.invoiceDate)}
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
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {inv.customerSnapshot.name}
                    </h4>
                    {inv.customerSnapshot.companyName && (
                      <p className="text-[11px] text-slate-500">{inv.customerSnapshot.companyName}</p>
                    )}
                    <a
                      href={`tel:${inv.customerSnapshot.mobile}`}
                      className="text-xs text-[#2563EB] font-mono hover:underline inline-block mt-0.5"
                    >
                      {inv.customerSnapshot.mobile}
                    </a>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">{inv.items.length} item(s)</span>
                    <span className="font-mono font-black text-slate-900 text-base">
                      {formatCurrency(inv.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setPreviewInvoice(inv)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#2563EB] font-semibold text-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View / Print</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPDF(inv)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs transition hover:bg-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  {inv.status === 'Active' && (
                    <button
                      onClick={() => setCancellingInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold text-xs transition hover:bg-red-100"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full 8-Column Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading calendar invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No invoices found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#142B4A]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {inv.customerSnapshot.name}
                      {inv.customerSnapshot.companyName && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {inv.customerSnapshot.companyName}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {inv.customerSnapshot.mobile}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[11px] font-semibold">
                        {inv.items.length} item(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono text-sm">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View & Print */}
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          title="View / Print A4"
                          className="p-1.5 rounded-md hover:bg-blue-50 text-[#2563EB] transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          title="Download PDF"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Cancel Invoice */}
                        {inv.status === 'Active' && (
                          <button
                            onClick={() => setCancellingInvoice(inv)}
                            title="Cancel Invoice"
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* Invoice Preview & Print Modal */}
      {previewInvoice && (
        <InvoicePrintView invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
      )}

      {/* Cancel Invoice Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(cancellingInvoice)}
        title="Cancel Invoice"
        message={`Are you sure you want to cancel invoice "${cancellingInvoice?.invoiceNumber}" for ${cancellingInvoice?.customerSnapshot.name}? Cancelled invoices will be excluded from all sales calculations but retained in historical records.`}
        confirmLabel="Yes, Cancel Invoice"
        isDestructive={true}
        onConfirm={handleCancelInvoice}
        onClose={() => setCancellingInvoice(null)}
      />
    </div>
  );
};
