import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '../types/invoice';
import type { CompanySettings } from '../types/settings';
import { formatDate, numberToWords } from './formatters';

export const generateInvoicePDF = (invoice: Invoice, settings?: CompanySettings) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor = [20, 43, 74]; // #142B4A
  const secondaryColor = [37, 99, 235]; // #2563EB
  const grayColor = [100, 116, 139];

  // 1. Header (Company Info)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(settings?.companyName || 'Amazing Ads', 14, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(settings?.address || '124, Sivakasi Main Road, Printing Hub', 14, 23);
  doc.text(
    `Mobile: ${settings?.mobile || '+91 98421 77889'}  |  Email: ${settings?.email || 'orders@amazingads.com'}`,
    14,
    27
  );
  if (settings?.gstin) {
    doc.text(`GSTIN: ${settings.gstin}  |  State: ${settings.state || 'Tamil Nadu'}`, 14, 31);
  }

  // TAX INVOICE title pill
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(pageWidth - 45, 12, 31, 8, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(invoice.isGstInvoice ? 'TAX INVOICE' : 'INVOICE', pageWidth - 42, 17.5);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 35, pageWidth - 14, 35);

  // 2. Invoice Details (Left: Customer, Right: Invoice Meta)
  // Left: Bill To
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('BILLED TO:', 14, 41);

  doc.setFontSize(10);
  doc.text(invoice.customerSnapshot.name, 14, 46);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  let custY = 50;
  if (invoice.customerSnapshot.companyName) {
    doc.text(invoice.customerSnapshot.companyName, 14, custY);
    custY += 4;
  }
  doc.text(invoice.customerSnapshot.billingAddress, 14, custY);
  custY += 4;
  doc.text(
    `${invoice.customerSnapshot.city}, ${invoice.customerSnapshot.state} - ${invoice.customerSnapshot.pincode}`,
    14,
    custY
  );
  custY += 4;
  doc.text(`Mobile: ${invoice.customerSnapshot.mobile}`, 14, custY);
  if (invoice.customerSnapshot.gstin) {
    custY += 4;
    doc.text(`Customer GSTIN: ${invoice.customerSnapshot.gstin}`, 14, custY);
  }

  // Right: Invoice Meta Box
  const metaX = pageWidth - 75;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('INVOICE DETAILS:', metaX, 41);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text('Invoice Number:', metaX, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber, metaX + 30, 46);

  doc.setFont('helvetica', 'normal');
  doc.text('Invoice Date:', metaX, 50);
  doc.text(formatDate(invoice.invoiceDate), metaX + 30, 50);

  doc.text('Place of Supply:', metaX, 54);
  doc.text(invoice.customerSnapshot.state, metaX + 30, 54);

  doc.text('Status:', metaX, 58);
  doc.setTextColor(invoice.status === 'Active' ? 22 : 220, invoice.status === 'Active' ? 101 : 38, invoice.status === 'Active' ? 52 : 38);
  doc.text(invoice.status.toUpperCase(), metaX + 30, 58);

  // 3. Products Table
  const tableData = invoice.items.map((item, idx) => [
    idx + 1,
    `${item.name}\nSize: ${item.size} | SKU: ${item.sku}`,
    `${item.quantity} ${item.unit}`,
    `₹${item.rate.toFixed(2)}`,
    item.discount > 0 ? `₹${item.discount.toFixed(2)}` : '-',
    invoice.isGstInvoice ? `${item.gstPercentage}%` : '0%',
    `₹${item.totalAmount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: Math.max(custY + 6, 64),
    head: [['#', 'Description of Goods', 'Qty', 'Unit Rate', 'Discount', 'GST %', 'Total (₹)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [20, 43, 74],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle',
    },
    margin: { left: 14, right: 14 },
  });

  // 4. Totals and Summary Box
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Amount in words (Left)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Amount in Words:', 14, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  const words = numberToWords(invoice.grandTotal);
  doc.text(words, 14, finalY + 4, { maxWidth: 100 });

  // Calculation Breakdown (Right)
  const boxWidth = 78;
  const boxX = pageWidth - 14 - boxWidth;
  const padX = 4;
  const labelX = boxX + padX;
  const valueX = pageWidth - 14 - padX;
  let curCalcY = finalY;

  const addCalcRow = (label: string, value: string, isBold: boolean = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(isBold ? 20 : 70, isBold ? 43 : 70, isBold ? 74 : 70);
    doc.text(label, labelX, curCalcY);
    doc.text(value, valueX, curCalcY, { align: 'right' });
    curCalcY += 4.8;
  };

  addCalcRow('Subtotal:', `₹${invoice.subtotal.toFixed(2)}`);

  if (invoice.itemDiscountTotal > 0 || invoice.additionalDiscount > 0) {
    const totalDisc = invoice.itemDiscountTotal + invoice.additionalDiscount;
    addCalcRow('Total Discounts:', `-₹${totalDisc.toFixed(2)}`);
  }

  addCalcRow('Taxable Amount:', `₹${invoice.taxableAmount.toFixed(2)}`, true);

  if (invoice.isGstInvoice) {
    if (invoice.isInterState) {
      addCalcRow('IGST:', `₹${invoice.igstAmount.toFixed(2)}`);
    } else {
      addCalcRow('CGST:', `₹${invoice.cgstAmount.toFixed(2)}`);
      addCalcRow('SGST:', `₹${invoice.sgstAmount.toFixed(2)}`);
    }
  }

  if (invoice.roundOff !== 0) {
    addCalcRow('Round Off:', `${invoice.roundOff > 0 ? '+' : ''}₹${invoice.roundOff.toFixed(2)}`);
  }

  // Grand Total highlight bar (perfectly aligned with table right margin & inner labels)
  curCalcY += 1.5;
  const barHeight = 8.5;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(boxX, curCalcY - 4.5, boxWidth, barHeight, 1.5, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Grand Total:', labelX, curCalcY + 1);
  doc.text(`₹${invoice.grandTotal.toFixed(2)}`, valueX, curCalcY + 1, {
    align: 'right',
  });

  // 5. Terms Block
  const termsY = Math.max(curCalcY + 14, finalY + 28);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Terms & Conditions:', 14, termsY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  const terms = settings?.termsAndConditions || '1. Goods once sold will not be returned.';
  doc.text(terms, 14, termsY + 4, { maxWidth: pageWidth - 28 });

  // Footer text
  if (settings?.invoiceFooterText) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(settings.invoiceFooterText, pageWidth / 2, 290, { align: 'center' });
  }

  // Save the PDF
  const cleanNumber = invoice.invoiceNumber.replace(/[\/\\]/g, '-');
  doc.save(`Invoice_${cleanNumber}.pdf`);
};

