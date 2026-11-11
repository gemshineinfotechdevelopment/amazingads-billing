import React, { useState, useEffect } from 'react';
import { Search, Plus, UserCheck, X } from 'lucide-react';
import type { Customer, CustomerInput } from '../../types/customer';
import { customerService } from '../../services/customerService';
import toast from 'react-hot-toast';

interface CustomerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const CustomerSelectorModal: React.FC<CustomerSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'create'>('select');
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state for creating a new customer inline
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
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers({ search, limit: 20 });
      setCustomers(res.data);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.billingAddress || !formData.city || !formData.state || !formData.pincode) {
      toast.error('Please fill all required customer fields');
      return;
    }

    try {
      const newCustomer = await customerService.createCustomer(formData);
      toast.success('Customer created successfully!');
      onSelectCustomer(newCustomer);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-bold text-slate-800 text-base">Select or Add Customer</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('select')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'select'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Select Existing Customer
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Customer</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'select' ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by customer name, mobile, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
                />
              </div>

              {loading ? (
                <div className="py-8 text-center text-sm text-slate-500">Searching customers...</div>
              ) : customers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500">No customers found.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="mt-2 text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    + Create a new customer now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
                  {customers.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => {
                        onSelectCustomer(c);
                        onClose();
                      }}
                      className="p-3 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition group"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 group-hover:text-[#2563EB]">
                          {c.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {c.companyName ? `${c.companyName} • ` : ''}Mobile: {c.mobile}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {c.city}, {c.state} {c.gstin ? `| GSTIN: ${c.gstin}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#2563EB] opacity-0 group-hover:opacity-100 transition">
                        Select →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Meenakshi Jewellers"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GSTIN (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="15-character GSTIN"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Billing Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street / Door No."
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madurai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tamil Nadu"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="6 digits"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('select')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  Save & Select Customer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

