import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import type { Invoice } from '../../types/invoice';
import { useSettings } from '../../context/SettingsContext';
import { formatDate, formatCurrency, numberToWords } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

interface InvoicePrintViewProps {
  invoice: Invoice;
  onClose?: () => void;
  isModal?: boolean;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  invoice,
  onClose,
  isModal = true,
}) => {
  const { settings } = useSettings();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateInvoicePDF(invoice, settings || undefined);
  };

  const content = (
    <div className="bg-white text-slate-800 print:text-black w-full max-w-[210mm] mx-auto min-h-[297mm] p-4 sm:p-8 md:p-12 print:p-0 flex flex-col justify-between shadow-lg print:shadow-none border border-slate-200 print:border-none rounded-xl print:rounded-none">
      {/* 1. Header (Company Information) */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-[#142B4A]/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#142B4A] tracking-tight uppercase">
                {settings?.companyName || 'Amazing Ads'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-md">
              {settings?.address || '124, Sivakasi Main Road, Printing Hub'}
            </p>
            <p className="text-xs text-slate-600">
              Mobile: <span className="font-semibold">{settings?.mobile || '+91 98421 77889'}</span>{' '}
              | Email: <span className="font-semibold">{settings?.email || 'orders@amazingads.com'}</span>
            </p>
            {settings?.gstin && (
              <p className="text-xs font-semibold text-[#142B4A] mt-0.5">
                GSTIN: {settings.gstin} | State: {settings.state || 'Tamil Nadu'}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="inline-block px-3 py-1 bg-[#142B4A] text-white text-xs font-bold uppercase tracking-wider rounded-md">
              {invoice.isGstInvoice ? 'TAX INVOICE' : 'INVOICE'}
            </span>
            <div className="mt-2 text-xs">
              <p className="font-bold text-sm text-[#142B4A]">Bill #{invoice.invoiceNumber}</p>
              <p className="text-slate-500">Date: {formatDate(invoice.invoiceDate)}</p>
              <p className="text-slate-500">Place of Supply: {invoice.customerSnapshot.state}</p>
              {invoice.status === 'Cancelled' && (
                <span className="inline-block px-2 py-0.5 mt-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded">
                  CANCELLED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Customer & Billing Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 rounded-lg bg-slate-50 border border-slate-100 print:bg-transparent print:border-none print:p-0">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Billed To:
            </span>
            <h4 className="font-bold text-sm text-slate-900 mt-1">
              {invoice.customerSnapshot.name}
            </h4>
            {invoice.customerSnapshot.companyName && (
              <p className="text-xs font-medium text-slate-700">
                {invoice.customerSnapshot.companyName}
              </p>
            )}
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {invoice.customerSnapshot.billingAddress}
              <br />
              {invoice.customerSnapshot.city}, {invoice.customerSnapshot.state} -{' '}
              {invoice.customerSnapshot.pincode}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Customer Details:
            </span>
            <p className="text-xs text-slate-700 mt-1">
              Mobile: <span className="font-semibold">{invoice.customerSnapshot.mobile}</span>
            </p>
            {invoice.customerSnapshot.email && (
              <p className="text-xs text-slate-600">Email: {invoice.customerSnapshot.email}</p>
            )}
            {invoice.customerSnapshot.gstin ? (
              <p className="text-xs font-bold text-[#142B4A] mt-1">
                GSTIN: {invoice.customerSnapshot.gstin}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic mt-1">Unregistered Buyer (Composite/B2C)</p>
            )}
          </div>
        </div>

        {/* 3. Product Table */}
        <div className="overflow-x-auto my-6">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-[#142B4A] text-white">
                <th className="py-2.5 px-3 w-8 text-center">#</th>
                <th className="py-2.5 px-3">Description of Calendar Goods</th>
                <th className="py-2.5 px-3 text-center">Qty / Unit</th>
                <th className="py-2.5 px-3 text-right">Unit Rate</th>
                <th className="py-2.5 px-3 text-right">Disc</th>
                {invoice.isGstInvoice && <th className="py-2.5 px-3 text-center">GST %</th>}
                <th className="py-2.5 px-3 text-right font-bold">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-center font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Category: {item.category} | Size: {item.size} | SKU: {item.sku}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-center font-medium">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">₹{item.rate.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    {item.discount > 0 ? `₹${item.discount.toFixed(2)}` : '-'}
                  </td>
                  {invoice.isGstInvoice && (
                    <td className="py-3 px-3 text-center">{item.gstPercentage}%</td>
                  )}
                  <td className="py-3 px-3 text-right font-bold font-mono text-slate-900">
                    ₹{item.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Financial Calculations Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
          {/* Amount in words */}
          <div className="flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Amount in Words:
            </span>
            <p className="text-xs font-bold text-[#142B4A] mt-1 capitalize leading-relaxed">
              {numberToWords(invoice.grandTotal)}
            </p>

            {invoice.notes && (
              <div className="mt-4 p-2.5 bg-slate-50 rounded text-xs text-slate-600 border border-slate-200">
                <span className="font-semibold text-slate-800">Note: </span>
                {invoice.notes}
              </div>
            )}
          </div>

          {/* Totals Table */}
          <div className="w-full sm:w-72 space-y-1.5 text-xs">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">₹{invoice.subtotal.toFixed(2)}</span>
            </div>

            {(invoice.itemDiscountTotal > 0 || invoice.additionalDiscount > 0) && (
              <div className="flex justify-between py-1 text-emerald-600 font-medium">
                <span>Total Discounts:</span>
                <span className="font-mono">
                  -₹{(invoice.itemDiscountTotal + invoice.additionalDiscount).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 text-slate-700 font-semibold border-t border-slate-100">
              <span>Taxable Amount:</span>
              <span className="font-mono">₹{invoice.taxableAmount.toFixed(2)}</span>
            </div>

            {invoice.isGstInvoice && (
              <>
                {invoice.isInterState ? (
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>IGST (Inter-State):</span>
                    <span className="font-mono">₹{invoice.igstAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between py-0.5 text-slate-600">
                      <span>CGST:</span>
                      <span className="font-mono">₹{invoice.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-slate-600">
                      <span>SGST:</span>
                      <span className="font-mono">₹{invoice.sgstAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </>
            )}

            {invoice.roundOff !== 0 && (
              <div className="flex justify-between py-1 text-slate-500">
                <span>Round Off:</span>
                <span className="font-mono">
                  {invoice.roundOff > 0 ? `+₹${invoice.roundOff.toFixed(2)}` : `-₹${Math.abs(invoice.roundOff).toFixed(2)}`}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 px-3 bg-[#142B4A] text-white rounded font-bold text-sm tracking-tight mt-2">
              <span>Grand Total:</span>
              <span className="text-base font-mono">{formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Terms & Signatures Footer */}
      <div className="mt-12 pt-6 border-t border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
          <div>
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Terms & Conditions:
            </h5>
            <p className="text-[10px] text-slate-500 mt-1 whitespace-pre-line leading-relaxed">
              {settings?.termsAndConditions ||
                '1. Goods once sold will not be returned or exchanged.\n2. Printing design proof confirmed is final.\n3. Disputed matters subject to Sivakasi Jurisdiction.'}
            </p>
          </div>

          <div className="text-right flex flex-col items-end">
            <p className="text-xs font-bold text-[#142B4A]">
              For {settings?.companyName || 'Amazing Ads'}
            </p>
            <div className="h-16 w-32 border-b border-dashed border-slate-300"></div>
            <p className="text-[11px] font-semibold text-slate-700 mt-1">Authorized Signatory</p>
          </div>
        </div>

        {settings?.invoiceFooterText && (
          <p className="text-[10px] text-center text-slate-400 mt-8 italic">
            {settings.invoiceFooterText}
          </p>
        )}
      </div>
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-4xl my-auto sm:my-8">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-t-xl border border-b-0 border-slate-200 print-hide gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-bold text-[#142B4A] truncate">Invoice Preview</span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-mono truncate">({invoice.invoiceNumber})</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <Printer className="w-4 h-4 text-[#2563EB]" />
              <span className="hidden xs:inline">Print A4</span>
              <span className="xs:hidden">Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xs:inline">Download PDF</span>
              <span className="xs:hidden">PDF</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Invoice Body */}
        <div className="bg-slate-100 p-2 sm:p-4 md:p-8 rounded-b-xl border border-slate-200 max-h-[85vh] overflow-y-auto overflow-x-auto print:overflow-visible print:p-0 print:border-none print:bg-white">
          {content}
        </div>
      </div>
    </div>
  );
};

