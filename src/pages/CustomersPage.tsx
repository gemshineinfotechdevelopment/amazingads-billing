import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  X,
  Eye,
} from 'lucide-react';
import { Pagination } from '../components/common/Pagination';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { InvoicePrintView } from '../components/invoice/InvoicePrintView';
import type { Customer, CustomerInput } from '../types/customer';
import type { Invoice } from '../types/invoice';
import { customerService } from '../services/customerService';
import type { CustomerDetailResponse } from '../services/customerService';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Customer History & Details Drawer
  const [viewingCustomer, setViewingCustomer] = useState<CustomerDetailResponse | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Form State
  const [formData, setFormData] = useState<CustomerInput>({
    name: '',
    mobile: '',
    email: '',
    companyName: '',
    gstin: '',
    billingAddress: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
  });

  useEffect(() => {
    loadCustomers();
  }, [search, page]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers({ search, page, limit: pageSize });
      setCustomers(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalItems(res.pagination.total);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      companyName: '',
      gstin: '',
      billingAddress: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email || '',
      companyName: c.companyName || '',
      gstin: c.gstin || '',
      billingAddress: c.billingAddress,
      city: c.city,
      state: c.state,
      pincode: c.pincode,
    });
    setIsModalOpen(true);
  };

  const handleOpenDetails = async (c: Customer) => {
    try {
      const details = await customerService.getCustomerById(c._id);
      setViewingCustomer(details);
    } catch {
      toast.error('Failed to load customer details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      toast.error('Customer Name and Mobile Number are required.');
      return;
    }

    const payload: CustomerInput = {
      ...formData,
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
      billingAddress: formData.billingAddress?.trim() || 'Direct Counter',
      city: formData.city?.trim() || 'Sivakasi',
      state: formData.state?.trim() || 'Tamil Nadu',
      pincode: formData.pincode?.trim() || '626123',
    };

    try {
      setSubmitting(true);
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer._id, payload);
        toast.success('Customer updated successfully in database!');
      } else {
        await customerService.createCustomer(payload);
        toast.success('Customer created successfully in database!');
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    try {
      await customerService.deleteCustomer(deletingCustomer._id);
      toast.success('Customer deleted successfully');
      loadCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
            Directory
          </span>
          <h2 className="text-xl font-bold text-[#142B4A]">Customer Management</h2>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, company, or city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
          />
        </div>
      </div>

      {/* Customers List / Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Mobile View: Customer Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading customer directory...
            </div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No customers found.
            </div>
          ) : (
            customers.map((c) => (
              <div key={c._id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                    {c.companyName && (
                      <p className="text-xs font-semibold text-slate-700">{c.companyName}</p>
                    )}
                    {c.email && (
                      <p className="text-[11px] text-slate-400">{c.email}</p>
                    )}
                  </div>
                  <div>
                    {c.gstin ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-[#142B4A] font-mono text-[10px] font-bold">
                        {c.gstin}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Unregistered</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Location: </span>
                    <span className="font-medium text-slate-800">{c.city}, {c.state}</span>
                  </div>
                  <div>
                    <a
                      href={`tel:${c.mobile}`}
                      className="font-mono font-bold text-[#2563EB] hover:underline"
                    >
                      {c.mobile}
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenDetails(c)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-[#2563EB] font-semibold text-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>History</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs transition hover:bg-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeletingCustomer(c)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full 6-Column Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">City / State</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {c.name}
                      {c.email && <span className="block text-[10px] text-slate-400 font-normal">{c.email}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {c.companyName || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{c.mobile}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {c.city}, <span className="font-semibold text-slate-800">{c.state}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {c.gstin ? (
                        <span className="font-bold text-[#142B4A]">{c.gstin}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unregistered</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details & History */}
                        <button
                          onClick={() => handleOpenDetails(c)}
                          title="View Details & Sales History"
                          className="p-1.5 rounded-md hover:bg-blue-50 text-[#2563EB] transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingCustomer(c)}
                          title="Delete Customer"
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 my-auto animate-in fade-in zoom-in-95 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#142B4A]">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S. Muthukumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digits"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Meenakshi Jewellers"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GSTIN (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="15 digits"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Billing Address (optional)
                </label>
                <input
                  type="text"
                  placeholder="Shop / Office Address, Street"
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Sivakasi / Madurai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Tamil Nadu"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="626123"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details & Invoice History Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-sm sm:text-base text-[#142B4A]">Customer Details & History</h3>
              </div>
              <button
                onClick={() => setViewingCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Summary Cards */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {viewingCustomer.customer.name}
                  </h4>
                  {viewingCustomer.customer.companyName && (
                    <p className="text-xs font-semibold text-slate-700">
                      {viewingCustomer.customer.companyName}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 mt-1">
                    Mobile: <a href={`tel:${viewingCustomer.customer.mobile}`} className="text-[#2563EB] font-mono font-bold hover:underline">{viewingCustomer.customer.mobile}</a>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {viewingCustomer.customer.billingAddress}, {viewingCustomer.customer.city},{' '}
                    {viewingCustomer.customer.state} - {viewingCustomer.customer.pincode}
                  </p>
                </div>
                <div className="sm:text-right sm:border-l sm:border-blue-100 sm:pl-4 pt-3 sm:pt-0 border-t border-blue-100/60 sm:border-t-0 shrink-0">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Revenue</p>
                  <p className="text-lg sm:text-xl font-black text-[#142B4A] font-mono mt-0.5">
                    {formatCurrency(viewingCustomer.totalBilled)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {viewingCustomer.invoiceCount} invoices generated
                  </p>
                </div>
              </div>

              {/* Invoice History List */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Past Calendar Invoices ({viewingCustomer.invoices.length})
                </h4>
                {viewingCustomer.invoices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No invoices recorded yet.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                    {viewingCustomer.invoices.map((inv) => (
                      <div
                        key={inv._id}
                        className="p-3 flex items-center justify-between text-xs hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-bold text-[#142B4A] font-mono">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-slate-400">{formatDate(inv.invoiceDate)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold font-mono text-slate-900">
                            {formatCurrency(inv.grandTotal)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inv.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                          <button
                            onClick={() => setPreviewInvoice(inv)}
                            className="p-1 rounded text-[#2563EB] hover:bg-blue-50"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Print Modal from Customer History */}
      {previewInvoice && (
        <InvoicePrintView invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deletingCustomer)}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${deletingCustomer?.name}"? Customers with existing invoices cannot be deleted.`}
        confirmLabel="Yes, Delete Customer"
        isDestructive={true}
        onConfirm={handleDelete}
        onClose={() => setDeletingCustomer(null)}
      />
    </div>
  );
};
