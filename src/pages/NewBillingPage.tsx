import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User,
  Plus,
  Trash2,
  Printer,
  Save,
  RotateCcw,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { InvoicePrintView } from '../components/invoice/InvoicePrintView';
import { ProductAutocomplete } from '../components/invoice/ProductAutocomplete';
import type { Invoice, InvoiceUnit } from '../types/invoice';
import type { Product } from '../types/product';
import { invoiceService } from '../services/invoiceService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

interface DirectBillingItemRow {
  productId?: string;
  name: string;
  sku?: string;
  category?: string;
  size: string;
  quantity: number | '';
  rate: number | '';
}

interface DirectBillingCustomer {
  name: string;
  mobile: string;
  companyName: string;
  gstin: string;
  billingAddress: string;
  city: string;
  state: string;
  pincode: string;
  email: string;
}

const BILLING_DRAFT_KEY = 'amazingads_billing_draft';

const getSavedBillingDraft = () => {
  try {
    const raw = localStorage.getItem(BILLING_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const NewBillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const { settings } = useSettings();

  const savedDraft = useMemo(() => (!isEditMode ? getSavedBillingDraft() : null), [isEditMode]);

  const [existingInvoiceNumber, setExistingInvoiceNumber] = useState<string>('');
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  // Load calendar products for instant suggestion dropdown
  useEffect(() => {
    productService
      .getProducts({ all: true })
      .then((res) => {
        if (res && res.data) {
          setAvailableProducts(res.data.filter((p) => p.status === 'Active'));
        }
      })
      .catch((err) => console.error('Failed to load products for suggestions:', err));
  }, []);

  // 1. Direct Customer Details Form (Restores draft on refresh)
  const [customer, setCustomer] = useState<DirectBillingCustomer>(() => {
    return (
      savedDraft?.customer || {
        name: '',
        mobile: '',
        companyName: '',
        gstin: '',
        billingAddress: '',
        city: '',
        state: settings?.state || 'Tamil Nadu',
        pincode: '',
        email: '',
      }
    );
  });

  // 2. Direct Invoice Meta (Restores draft on refresh)
  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    return savedDraft?.invoiceDate || new Date().toISOString().split('T')[0];
  });
  const [isGstInvoice, setIsGstInvoice] = useState<boolean>(() => {
    return savedDraft?.isGstInvoice !== undefined ? savedDraft.isGstInvoice : true;
  });
  const [invoiceGstRate, setInvoiceGstRate] = useState<number | ''>(() => {
    return savedDraft?.invoiceGstRate !== undefined
      ? savedDraft.invoiceGstRate
      : (settings?.defaultGstRate ?? 12);
  });
  const [notes, setNotes] = useState<string>(() => {
    return savedDraft?.notes || '';
  });

  // 3. Direct Invoice Items (Restores draft on refresh)
  const [items, setItems] = useState<DirectBillingItemRow[]>(() => {
    if (savedDraft?.items && Array.isArray(savedDraft.items) && savedDraft.items.length > 0) {
      return savedDraft.items;
    }
    return [
      {
        name: '',
        size: '',
        quantity: 1,
        rate: '',
      },
    ];
  });

  // Automatically save form data to localStorage draft on every input (only when creating new bill)
  useEffect(() => {
    if (!isEditMode && !loadingInvoice) {
      const hasContent =
        Boolean(customer.name?.trim()) ||
        Boolean(customer.mobile?.trim()) ||
        Boolean(customer.companyName?.trim()) ||
        items.some((i) => Boolean(i.name?.trim()) || (i.rate !== '' && Number(i.rate) > 0)) ||
        Boolean(notes?.trim());

      if (hasContent) {
        const draftData = {
          customer,
          items,
          invoiceDate,
          isGstInvoice,
          invoiceGstRate,
          notes,
        };
        localStorage.setItem(BILLING_DRAFT_KEY, JSON.stringify(draftData));
      } else {
        localStorage.removeItem(BILLING_DRAFT_KEY);
      }
    }
  }, [customer, items, invoiceDate, isGstInvoice, invoiceGstRate, notes, isEditMode, loadingInvoice]);

  // 4. Save & Print State
  const [submitting, setSubmitting] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>('');

  // Fetch existing invoice if in Edit Mode
  useEffect(() => {
    if (id) {
      setLoadingInvoice(true);
      invoiceService
        .getInvoiceById(id)
        .then((inv) => {
          setExistingInvoiceNumber(inv.invoiceNumber);
          setCustomer({
            name: inv.customerSnapshot?.name || '',
            mobile: inv.customerSnapshot?.mobile || '',
            companyName: inv.customerSnapshot?.companyName || '',
            gstin: inv.customerSnapshot?.gstin || '',
            billingAddress: inv.customerSnapshot?.billingAddress || '',
            city: inv.customerSnapshot?.city || '',
            state: inv.customerSnapshot?.state || 'Tamil Nadu',
            pincode: inv.customerSnapshot?.pincode || '',
            email: inv.customerSnapshot?.email || '',
          });
          if (inv.invoiceDate) {
            setInvoiceDate(new Date(inv.invoiceDate).toISOString().split('T')[0]);
          }
          setIsGstInvoice(inv.isGstInvoice);
          setNotes(inv.notes || '');
          if (inv.items && inv.items.length > 0) {
            setItems(
              inv.items.map((item) => ({
                productId: item.productId,
                name: item.name,
                sku: item.sku,
                category: item.category,
                size: item.size || '',
                quantity: item.quantity !== undefined ? item.quantity : 1,
                rate: item.rate,
              }))
            );
            if (inv.items[0]?.gstPercentage !== undefined) {
              setInvoiceGstRate(inv.items[0].gstPercentage);
            }
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to load invoice for editing');
          navigate('/invoices');
        })
        .finally(() => setLoadingInvoice(false));
    }
  }, [id, navigate]);

  // Fetch upcoming invoice number preview on mount and whenever invoice settings change (only in Create mode)
  useEffect(() => {
    if (!isEditMode) {
      invoiceService
        .getNextInvoiceNumber()
        .then((num) => setNextInvoiceNumber(num))
        .catch((err) => console.error('Failed to peek next invoice number:', err));
    }
  }, [isEditMode, settings?.invoicePrefix, settings?.financialYear, settings?.startingNumber]);

  // Synchronize company defaults and default GST rate when settings load
  useEffect(() => {
    if (settings) {
      setCustomer((prev) => ({
        ...prev,
        state: prev.state ? prev.state : (settings.state || 'Tamil Nadu'),
      }));
      if (!isEditMode && settings.defaultGstRate !== undefined) {
        setInvoiceGstRate(settings.defaultGstRate);
      }
    }
  }, [settings, isEditMode]);

  // Quick customer lookup on entering 10-digit mobile number
  const handleMobileChange = async (val: string) => {
    // Only accept numeric digits, maximum 10 digits
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setCustomer((prev) => ({ ...prev, mobile: digitsOnly }));

    if (digitsOnly.length === 10) {
      try {
        const existing = await customerService.lookupByMobile(digitsOnly);
        if (existing) {
          setCustomer({
            name: existing.name || '',
            mobile: existing.mobile || digitsOnly,
            companyName: existing.companyName || '',
            gstin: existing.gstin || '',
            billingAddress: existing.billingAddress || '',
            city: existing.city || '',
            state: existing.state || settings?.state || 'Tamil Nadu',
            pincode: existing.pincode || '',
            email: existing.email || '',
          });
          toast.success(`Existing customer found: ${existing.name}`);
        }
      } catch (e) {
        // silent catch
      }
    }
  };

  // Determine Inter-state (IGST) vs Intra-state (CGST + SGST)
  const isInterState = useMemo(() => {
    const compState = settings?.state || 'Tamil Nadu';
    const custState = customer.state || 'Tamil Nadu';
    return custState.trim().toLowerCase() !== compState.trim().toLowerCase();
  }, [customer.state, settings?.state]);

  // Financial Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;

    const calculatedItems = items.map((item) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const rate = Math.max(0, Number(item.rate) || 0);
      const itemTotal = Number((qty * rate).toFixed(2));
      subtotal += itemTotal;

      return {
        ...item,
        quantity: qty,
        unit: 'Pieces' as InvoiceUnit,
        discount: 0,
        rate,
        taxableAmount: itemTotal,
        totalAmount: itemTotal,
      };
    });

    const taxableAmount = subtotal;
    const effectiveGstRate = isGstInvoice ? Number(invoiceGstRate) || 0 : 0;
    const totalGst = Number(((taxableAmount * effectiveGstRate) / 100).toFixed(2));

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isGstInvoice && totalGst > 0) {
      if (isInterState) {
        igstAmount = totalGst;
      } else {
        cgstAmount = Number((totalGst / 2).toFixed(2));
        sgstAmount = Number((totalGst / 2).toFixed(2));
      }
    }

    const rawGrandTotal = taxableAmount + (isInterState ? igstAmount : cgstAmount + sgstAmount);
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

    return {
      calculatedItems,
      subtotal,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGstAmount: totalGst,
      roundOff,
      grandTotal,
    };
  }, [items, isGstInvoice, isInterState, invoiceGstRate]);

  // Add a new empty row
  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        name: '',
        size: '',
        quantity: 1,
        rate: '',
      },
    ]);
  };

  // Update item field
  const handleUpdateItem = (index: number, field: keyof DirectBillingItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Select calendar product from suggestion dropdown
  const handleSelectProduct = (index: number, product: Product) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      size: updated[index].size || product.size || '',
      rate: product.sellingPrice !== undefined ? product.sellingPrice : updated[index].rate,
    };
    setItems(updated);
    toast.success(`Selected "${product.name}" (₹${product.sellingPrice})`, {
      id: `product-select-${index}`,
      duration: 1500,
    });
  };

  // Remove item row
  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error('Invoice must have at least one product item.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Reset form
  const handleReset = () => {
    if (!window.confirm('Reset all entered billing details?')) {
      return;
    }
    localStorage.removeItem(BILLING_DRAFT_KEY);
    setCustomer({
      name: '',
      mobile: '',
      companyName: '',
      gstin: '',
      billingAddress: '',
      city: '',
      state: settings?.state || 'Tamil Nadu',
      pincode: '',
      email: '',
    });
    setItems([
      {
        name: '',
        size: '',
        quantity: 1,
        rate: '',
      },
    ]);
    setNotes('');
    toast.success('Form and draft cleared.');
  };

  // Save Invoice Direct to DB
  const handleSaveInvoice = async (andPrint: boolean = false): Promise<Invoice | null> => {
    if (!customer.name.trim()) {
      toast.error('Please enter the Customer Name.');
      return null;
    }
    const cleanedMobile = customer.mobile.replace(/\D/g, '').trim();
    if (!cleanedMobile) {
      toast.error('Please enter the Customer Mobile Number.');
      return null;
    }
    if (cleanedMobile.length !== 10) {
      toast.error('Mobile Number must be exactly 10 digits.');
      return null;
    }

    const emptyItems = items.filter((i) => !i.name.trim());
    if (emptyItems.length > 0) {
      toast.error('Please enter the Item Description / Product Name for all rows.');
      return null;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerData: {
          name: customer.name.trim(),
          mobile: customer.mobile.trim(),
          companyName: customer.companyName.trim(),
          gstin: customer.gstin.trim(),
          billingAddress: customer.billingAddress.trim() || 'Direct Billing',
          city: customer.city.trim() || 'Sivakasi',
          state: customer.state.trim() || settings?.state || 'Tamil Nadu',
          pincode: customer.pincode.trim() || '626123',
          email: customer.email.trim(),
        },
        invoiceDate,
        items: items.map((i, idx) => ({
          productId: i.productId,
          name: i.name.trim(),
          sku: i.sku || String(idx + 1),
          category: i.category || 'Calendar Printing',
          size: i.size?.trim() || 'Standard',
          quantity: Math.max(1, Number(i.quantity) || 1),
          unit: 'Pieces' as InvoiceUnit,
          rate: Math.max(0, Number(i.rate) || 0),
          discount: 0,
          gstPercentage: isGstInvoice ? (Number(invoiceGstRate) || 0) : 0,
        })),
        additionalDiscount: 0,
        isGstInvoice,
        notes,
      };

      if (isEditMode && id) {
        const updated = await invoiceService.updateInvoice(id, payload);
        toast.success(`Invoice #${updated.invoiceNumber} updated successfully!`);
        setSavedInvoice(updated);

        if (andPrint) {
          setShowPreviewModal(true);
        } else {
          setTimeout(() => {
            navigate('/invoices');
          }, 500);
        }

        return updated;
      }

      const created = await invoiceService.createInvoice(payload);
      localStorage.removeItem(BILLING_DRAFT_KEY);
      toast.success(`Bill generated successfully: ${created.invoiceNumber}`);
      setSavedInvoice(created);

      if (andPrint) {
        setShowPreviewModal(true);
      } else {
        setTimeout(() => {
          navigate('/invoices');
        }, 600);
      }

      return created;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save bill');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInvoice) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200">
        Loading invoice #{existingInvoiceNumber || id} for editing...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Actions */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
            <Receipt className="w-4 h-4" />
            <span>{isEditMode ? 'Modify Invoice Record' : 'Direct Billing Counter'}</span>
            {isEditMode ? (
              <span className="ml-1 sm:ml-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200">
                Editing Invoice #{existingInvoiceNumber}
              </span>
            ) : nextInvoiceNumber ? (
              <span className="ml-1 sm:ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-mono font-bold border border-blue-200">
                Next Bill: {nextInvoiceNumber}
              </span>
            ) : null}
            {!isEditMode && (customer.name || customer.mobile || items[0]?.name) && (
              <span className="ml-1 sm:ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                Draft Saved
              </span>
            )}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-[#142B4A]">
            {isEditMode ? `Edit Calendar Invoice #${existingInvoiceNumber}` : 'New Calendar Invoice'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => (isEditMode ? navigate('/invoices') : handleReset())}
            className="flex-1 sm:flex-initial justify-center px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Cancel Edit' : 'Reset'}</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSaveInvoice(false)}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1e3c66] rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-blue-300" />
            <span>{submitting ? 'Saving...' : isEditMode ? 'Update Invoice' : 'Save Invoice'}</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSaveInvoice(true)}
            className="w-full sm:w-auto justify-center px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEditMode ? 'Update & Print A4' : 'Save & Print A4'}</span>
          </button>
        </div>
      </div>

      {/* 2. Customer & Billing Details (Direct Input Form) */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2.5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#142B4A]">Customer & Invoice Information</h3>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
            {/* Tax Regime Indicator */}
            <span
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                isInterState
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
            </span>

            {/* GST Invoice Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isGstInvoice}
                onChange={(e) => setIsGstInvoice(e.target.checked)}
                className="w-4 h-4 text-[#2563EB] rounded focus:ring-blue-500"
              />
              <span>GST Tax Invoice</span>
            </label>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. S. Muthukumar"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number (10 digits) *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]{10}"
              placeholder="10-digit mobile"
              value={customer.mobile}
              onChange={(e) => handleMobileChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Company / Shop Name
            </label>
            <input
              type="text"
              placeholder="e.g. Meenakshi Jewellers"
              value={customer.companyName}
              onChange={(e) => setCustomer({ ...customer, companyName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer GSTIN (optional)
            </label>
            <input
              type="text"
              placeholder="15-character GSTIN"
              value={customer.gstin}
              onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none uppercase font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Billing Address
            </label>
            <input
              type="text"
              placeholder="Street / Door No."
              value={customer.billingAddress}
              onChange={(e) => setCustomer({ ...customer, billingAddress: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
            <input
              type="text"
              placeholder="Madurai / Sivakasi"
              value={customer.city}
              onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              State (Tax Rate Trigger)
            </label>
            <input
              type="text"
              placeholder="Tamil Nadu"
              value={customer.state}
              onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Direct Invoice Items (Mobile Cards + Desktop Table) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col xs:flex-row xs:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-[#142B4A]">
              Calendar Items to Bill ({items.length})
            </h3>
            <p className="text-xs text-slate-500">
              Type product name, size, quantity, and unit rate directly.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddItemRow}
            className="self-start xs:self-auto px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item Row</span>
          </button>
        </div>

        {/* Mobile View: Clean Touch Cards */}
        <div className="block md:hidden p-3.5 space-y-3.5 bg-slate-50/40">
          {calculations.calculatedItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-xs text-slate-700">
                  Item #{idx + 1}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-[#142B4A]">
                    ₹{item.totalAmount.toFixed(2)}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      title="Remove Item"
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Product Description with Autocomplete */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Product Description *
                </label>
                <ProductAutocomplete
                  required
                  placeholder="Type calendar name (e.g. Royal Gold, Desk...)"
                  value={item.name}
                  onChange={(val) => handleUpdateItem(idx, 'name', val)}
                  onSelectProduct={(p) => handleSelectProduct(idx, p)}
                  products={availableProducts}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:border-[#2563EB] outline-none"
                />
              </div>

              {/* Size, Qty & Rate in Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 15x20 inch"
                    value={item.size}
                    onChange={(e) => handleUpdateItem(idx, 'size', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs text-slate-700 border border-slate-200 rounded-lg focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Qty *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateItem(
                        idx,
                        'quantity',
                        e.target.value === '' ? '' : Math.max(1, Number(e.target.value))
                      )
                    }
                    className="w-full px-2 py-1.5 text-center text-xs font-bold font-mono text-slate-900 border border-slate-200 rounded-lg focus:border-[#2563EB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={item.rate || ''}
                    onChange={(e) =>
                      handleUpdateItem(idx, 'rate', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                    }
                    className="w-full px-2 py-1.5 text-right font-mono font-bold text-slate-900 border border-slate-200 rounded-lg focus:border-[#2563EB] outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Wide Data Entry Table */}
        <div className="hidden md:block overflow-x-auto min-h-[280px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[260px]">Description / Calendar Product *</th>
                <th className="py-2.5 px-3 w-36">Size</th>
                <th className="py-2.5 px-3 w-28 text-center">Qty *</th>
                <th className="py-2.5 px-3 w-36 text-right">Rate (₹) *</th>
                <th className="py-2.5 px-3 w-36 text-right font-bold">Total (₹)</th>
                <th className="py-2.5 px-2 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculations.calculatedItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                    {idx + 1}
                  </td>

                  {/* Product / Description Direct Input with Autocomplete */}
                  <td className="py-2.5 px-3">
                    <ProductAutocomplete
                      required
                      placeholder="Type calendar name (e.g. Royal Gold, Desk...)"
                      value={item.name}
                      onChange={(val) => handleUpdateItem(idx, 'name', val)}
                      onSelectProduct={(p) => handleSelectProduct(idx, p)}
                      products={availableProducts}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200 rounded-md focus:border-[#2563EB] outline-none"
                    />
                  </td>

                  {/* Size */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      placeholder="e.g. 15x20 inch"
                      value={item.size}
                      onChange={(e) => handleUpdateItem(idx, 'size', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs text-slate-700 border border-slate-200 rounded-md focus:border-[#2563EB] outline-none"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateItem(
                          idx,
                          'quantity',
                          e.target.value === '' ? '' : Math.max(1, Number(e.target.value))
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-center text-xs font-bold font-mono text-slate-900 border border-slate-200 rounded-md focus:border-[#2563EB] outline-none"
                    />
                  </td>

                  {/* Rate / Amount */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={item.rate || ''}
                      onChange={(e) =>
                        handleUpdateItem(idx, 'rate', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-2.5 py-1.5 text-right font-mono font-bold text-slate-900 border border-slate-200 rounded-md focus:border-[#2563EB] outline-none"
                    />
                  </td>

                  {/* Total Amount (Qty * Rate) */}
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900 text-sm">
                    ₹{item.totalAmount.toFixed(2)}
                  </td>

                  {/* Remove Row */}
                  <td className="py-2.5 px-2 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        title="Remove Row"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Row Add Bar */}
        <div className="p-3 bg-slate-50/50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={handleAddItemRow}
            className="text-xs font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-blue-50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Item Row</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Total {items.length} line item(s)
          </span>
        </div>
      </div>

      {/* 4. Bottom Section: Notes & Live Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Notes / Delivery Remarks */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-[#142B4A]">Invoice Remarks & Delivery</h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Invoice Remarks / Delivery Notes
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Dispatched via Sivakasi Lorry Service / Delivered in full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>
        </div>

        {/* Right: Calculations Breakdown & Grand Total */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h4 className="text-sm font-bold text-[#142B4A]">Invoice Calculation</h4>
            {isGstInvoice ? (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                GST Tax Invoice
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Non-GST Invoice
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 text-slate-600">
              <span className="font-medium">Subtotal (Items Total):</span>
              <span className="font-mono font-bold text-slate-800">₹{calculations.subtotal.toFixed(2)}</span>
            </div>

            {isGstInvoice ? (
              <div className="bg-slate-50/90 p-3 rounded-lg border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-bold text-slate-700">
                    GST Tax Rate (%):
                  </label>
                  <div className="relative w-28">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="12"
                      value={invoiceGstRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setInvoiceGstRate('');
                        } else {
                          const num = Number(val);
                          if (!isNaN(num) && num >= 0 && num <= 100) {
                            setInvoiceGstRate(num);
                          }
                        }
                      }}
                      className="w-full pl-2.5 pr-7 py-1 text-right text-xs font-bold font-mono text-slate-800 border border-slate-200 rounded-md bg-white focus:border-[#2563EB] outline-none shadow-2xs"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                {isInterState ? (
                  <div className="flex justify-between text-slate-600 text-[11px] pt-1.5 border-t border-slate-200">
                    <span>IGST ({Number(invoiceGstRate) || 0}%):</span>
                    <span className="font-mono font-semibold">₹{calculations.igstAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1.5 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span>CGST ({((Number(invoiceGstRate) || 0) / 2).toFixed(1)}%):</span>
                      <span className="font-mono font-semibold">₹{calculations.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST ({((Number(invoiceGstRate) || 0) / 2).toFixed(1)}%):</span>
                      <span className="font-mono font-semibold">₹{calculations.sgstAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total GST Amount:</span>
                  <span className="font-mono text-[#2563EB]">₹{calculations.totalGstAmount.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="py-1 text-slate-400 text-xs italic">
                Non-GST Invoice (No tax applied)
              </div>
            )}

            {calculations.roundOff !== 0 && (
              <div className="flex justify-between py-1 text-slate-500">
                <span>Round Off:</span>
                <span className="font-mono">
                  {calculations.roundOff > 0 ? `+₹${calculations.roundOff.toFixed(2)}` : `-₹${Math.abs(calculations.roundOff).toFixed(2)}`}
                </span>
              </div>
            )}
          </div>

          {/* Grand Total Box & Save Actions */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center py-3 px-4 bg-[#142B4A] text-white rounded-xl mb-4 shadow-sm">
              <span className="font-bold text-sm tracking-wide">GRAND TOTAL:</span>
              <span className="text-2xl font-black font-mono tracking-tight">
                {formatCurrency(calculations.grandTotal)}
              </span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSaveInvoice(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-blue-300" />
                <span>{submitting ? 'Saving...' : isEditMode ? 'Update Invoice' : 'Save Invoice'}</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSaveInvoice(true)}
                className="flex-1 py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>{submitting ? 'Saving...' : isEditMode ? 'Update & Print A4' : 'Save & Print A4'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Print & PDF View Modal */}
      {showPreviewModal && savedInvoice && (
        <InvoicePrintView
          invoice={savedInvoice}
          onClose={() => {
            setShowPreviewModal(false);
            navigate('/invoices');
          }}
        />
      )}
    </div>
  );
};
