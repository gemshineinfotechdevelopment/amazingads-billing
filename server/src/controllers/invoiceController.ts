import { Request, Response } from 'express';
import { Invoice, IInvoiceItem } from '../models/Invoice.js';
import { Customer } from '../models/Customer.js';
import { CompanySettings } from '../models/CompanySettings.js';
import { InvoiceCounter } from '../models/InvoiceCounter.js';
import { getNextInvoiceNumber, peekNextInvoiceNumber, formatInvoiceNumber } from '../utils/counter.js';

// Helper to calculate invoice financial figures safely
export const calculateInvoiceFigures = (
  items: Array<{
    productId?: any;
    name: string;
    sku: string;
    category: string;
    size: string;
    quantity: number;
    unit: any;
    rate: number;
    discount?: number;
    gstPercentage?: number;
  }>,
  additionalDiscount: number = 0,
  isGstInvoice: boolean = true,
  isInterState: boolean = false
) => {
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let totalTaxable = 0;
  let totalGst = 0;

  const processedItems: IInvoiceItem[] = items.map((item, idx) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const rate = Math.max(0, Number(item.rate) || 0);
    const itemDisc = Math.max(0, Number(item.discount) || 0);
    const itemGross = qty * rate;
    const taxableAmount = Math.max(0, itemGross - itemDisc);

    const gstPct = isGstInvoice ? Number(item.gstPercentage ?? 12) : 0;
    const gstAmt = isGstInvoice ? Number(((taxableAmount * gstPct) / 100).toFixed(2)) : 0;
    const totalAmount = Number((taxableAmount + gstAmt).toFixed(2));

    subtotal += itemGross;
    itemDiscountTotal += itemDisc;
    totalTaxable += taxableAmount;
    totalGst += gstAmt;

    return {
      productId: item.productId,
      name: item.name?.trim() || `Calendar Item ${idx + 1}`,
      sku: item.sku?.trim() || `ITEM-${idx + 1}`,
      category: item.category?.trim() || 'General Calendar',
      size: item.size?.trim() || 'Standard',
      quantity: qty,
      unit: item.unit || 'Pieces',
      rate,
      discount: itemDisc,
      taxableAmount,
      gstPercentage: gstPct,
      gstAmount: gstAmt,
      totalAmount,
    };
  });

  const finalTaxable = Math.max(0, totalTaxable - Math.max(0, Number(additionalDiscount) || 0));

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isGstInvoice && totalGst > 0) {
    if (isInterState) {
      igstAmount = Number(totalGst.toFixed(2));
    } else {
      cgstAmount = Number((totalGst / 2).toFixed(2));
      sgstAmount = Number((totalGst / 2).toFixed(2));
    }
  }

  const rawGrandTotal = finalTaxable + (isInterState ? igstAmount : cgstAmount + sgstAmount);
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  return {
    processedItems,
    subtotal: Number(subtotal.toFixed(2)),
    itemDiscountTotal: Number(itemDiscountTotal.toFixed(2)),
    additionalDiscount: Math.max(0, Number(additionalDiscount) || 0),
    taxableAmount: Number(finalTaxable.toFixed(2)),
    isGstInvoice,
    isInterState,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalGstAmount: Number(totalGst.toFixed(2)),
    roundOff,
    grandTotal: roundedGrandTotal,
  };
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, startDate, endDate, customerId, page = 1, limit = 10 } = req.query;

    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (customerId) {
      query.customer = customerId;
    }

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    if (search) {
      const q = String(search).trim();
      query.$or = [
        { invoiceNumber: { $regex: q, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: q, $options: 'i' } },
        { 'customerSnapshot.mobile': { $regex: q, $options: 'i' } },
        { 'customerSnapshot.companyName': { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    // Display "Last In, First" (newest / highest sequence invoice first)
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort({ sequenceNumber: -1, createdAt: -1, _id: -1 }).skip(skip).limit(limitNum),
      Invoice.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNextInvoiceNumberPreview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const nextInvoiceNumber = await peekNextInvoiceNumber();
    res.json({
      success: true,
      data: {
        nextInvoiceNumber,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      customerData,
      invoiceDate,
      items,
      additionalDiscount = 0,
      isGstInvoice = true,
      notes = '',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'At least one invoice item is required.' });
      return;
    }

    // Resolve or automatically create Customer
    let customer;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        res.status(404).json({ success: false, message: 'Selected customer not found.' });
        return;
      }
    } else if (customerData && (customerData.name || customerData.mobile)) {
      const mobileClean = customerData.mobile?.trim() || '';
      if (mobileClean) {
        customer = await Customer.findOne({ mobile: mobileClean });
      }
      if (!customer) {
        customer = await Customer.create({
          name: customerData.name?.trim() || 'Direct Customer',
          mobile: mobileClean || '0000000000',
          email: customerData.email?.trim() || '',
          companyName: customerData.companyName?.trim() || '',
          gstin: customerData.gstin?.toUpperCase()?.trim() || '',
          billingAddress: customerData.billingAddress?.trim() || 'Direct Counter',
          city: customerData.city?.trim() || 'Sivakasi',
          state: customerData.state?.trim() || 'Tamil Nadu',
          pincode: customerData.pincode?.trim() || '626123',
        });
      } else {
        if (customerData.name) customer.name = customerData.name.trim();
        if (customerData.email !== undefined) customer.email = customerData.email.trim();
        if (customerData.billingAddress) customer.billingAddress = customerData.billingAddress.trim();
        if (customerData.city) customer.city = customerData.city.trim();
        if (customerData.state) customer.state = customerData.state.trim();
        if (customerData.pincode) customer.pincode = customerData.pincode.trim();
        if (customerData.gstin) customer.gstin = customerData.gstin.toUpperCase().trim();
        if (customerData.companyName) customer.companyName = customerData.companyName.trim();
        await customer.save();
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Customer Name and Mobile or Customer ID is required to create a bill.',
      });
      return;
    }

    // Fetch company settings to compare states (Intra vs Inter-state IGST)
    const settings = await CompanySettings.findOne();
    const companyState = settings?.state || 'Tamil Nadu';
    const customerState = customer.state || 'Tamil Nadu';
    const isInterState =
      customerState.trim().toLowerCase() !== companyState.trim().toLowerCase();

    // Calculate figures
    const figures = calculateInvoiceFigures(
      items,
      additionalDiscount,
      Boolean(isGstInvoice),
      isInterState
    );

    // Atomically generate sequential invoice number (1, 2, 3...)
    const invoiceNumber = await getNextInvoiceNumber();
    const sequenceNumber = Number(invoiceNumber) || 1;

    const invoice = await Invoice.create({
      invoiceNumber,
      sequenceNumber,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      customer: customer._id,
      customerSnapshot: {
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        companyName: customer.companyName,
        gstin: customer.gstin,
        billingAddress: customer.billingAddress,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
      },
      items: figures.processedItems,
      subtotal: figures.subtotal,
      itemDiscountTotal: figures.itemDiscountTotal,
      additionalDiscount: figures.additionalDiscount,
      taxableAmount: figures.taxableAmount,
      isGstInvoice: figures.isGstInvoice,
      isInterState: figures.isInterState,
      cgstAmount: figures.cgstAmount,
      sgstAmount: figures.sgstAmount,
      igstAmount: figures.igstAmount,
      totalGstAmount: figures.totalGstAmount,
      roundOff: figures.roundOff,
      grandTotal: figures.grandTotal,
      status: 'Active',
      notes: notes?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      items,
      additionalDiscount,
      isGstInvoice,
      notes,
      invoiceDate,
      customerData,
      customerSnapshot,
    } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (invoice.status === 'Cancelled') {
      res.status(400).json({ success: false, message: 'Cannot edit a cancelled invoice.' });
      return;
    }

    // Update Customer Snapshot if provided
    const cust = customerData || customerSnapshot;
    if (cust) {
      if (cust.name) invoice.customerSnapshot.name = cust.name.trim();
      if (cust.mobile) invoice.customerSnapshot.mobile = cust.mobile.trim();
      if (cust.email !== undefined) invoice.customerSnapshot.email = cust.email.trim();
      if (cust.companyName !== undefined) invoice.customerSnapshot.companyName = cust.companyName.trim();
      if (cust.gstin !== undefined) invoice.customerSnapshot.gstin = cust.gstin.trim().toUpperCase();
      if (cust.billingAddress) invoice.customerSnapshot.billingAddress = cust.billingAddress.trim();
      if (cust.city) invoice.customerSnapshot.city = cust.city.trim();
      if (cust.state) invoice.customerSnapshot.state = cust.state.trim();
      if (cust.pincode) invoice.customerSnapshot.pincode = cust.pincode.trim();

      const settings = await CompanySettings.findOne();
      const compState = settings?.state || 'Tamil Nadu';
      const custState = invoice.customerSnapshot.state || 'Tamil Nadu';
      invoice.isInterState = custState.trim().toLowerCase() !== compState.trim().toLowerCase();

      if (invoice.customer) {
        await Customer.findByIdAndUpdate(invoice.customer, {
          name: invoice.customerSnapshot.name,
          mobile: invoice.customerSnapshot.mobile,
          email: invoice.customerSnapshot.email,
          companyName: invoice.customerSnapshot.companyName,
          gstin: invoice.customerSnapshot.gstin,
          billingAddress: invoice.customerSnapshot.billingAddress,
          city: invoice.customerSnapshot.city,
          state: invoice.customerSnapshot.state,
          pincode: invoice.customerSnapshot.pincode,
        });
      }
    }

    // Recalculate invoice items and financial figures
    const finalItems = items && Array.isArray(items) && items.length > 0 ? items : invoice.items;
    const finalAdditionalDisc =
      additionalDiscount !== undefined ? Number(additionalDiscount) : invoice.additionalDiscount;
    const finalIsGst =
      isGstInvoice !== undefined ? Boolean(isGstInvoice) : invoice.isGstInvoice;

    const figures = calculateInvoiceFigures(
      finalItems,
      finalAdditionalDisc,
      finalIsGst,
      invoice.isInterState
    );

    invoice.items = figures.processedItems;
    invoice.subtotal = figures.subtotal;
    invoice.itemDiscountTotal = figures.itemDiscountTotal;
    invoice.additionalDiscount = figures.additionalDiscount;
    invoice.taxableAmount = figures.taxableAmount;
    invoice.isGstInvoice = figures.isGstInvoice;
    invoice.cgstAmount = figures.cgstAmount;
    invoice.sgstAmount = figures.sgstAmount;
    invoice.igstAmount = figures.igstAmount;
    invoice.totalGstAmount = figures.totalGstAmount;
    invoice.roundOff = figures.roundOff;
    invoice.grandTotal = figures.grandTotal;

    if (notes !== undefined) invoice.notes = notes.trim();
    if (invoiceDate) invoice.invoiceDate = new Date(invoiceDate);

    await invoice.save();

    res.json({
      success: true,
      message: `Invoice #${invoice.invoiceNumber} updated successfully`,
      data: invoice,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason = 'Cancelled by Administrator' } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (invoice.status === 'Cancelled') {
      res.status(400).json({ success: false, message: 'Invoice is already cancelled.' });
      return;
    }

    invoice.status = 'Cancelled';
    invoice.cancelledAt = new Date();
    invoice.cancelReason = reason;

    await invoice.save();

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} has been cancelled.`,
      data: invoice,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Resequence all invoices starting from 1 (or startingNumber) in continuous sequential order.
 * Stores pure numbers 1, 2, 3... in both sequenceNumber and invoiceNumber across MongoDB.
 */
export const resequenceInvoices = async (): Promise<void> => {
  const settings = await CompanySettings.findOne();
  const startingNumber = Math.max(1, settings?.startingNumber ?? 1);
  const identifier = 'invoice-sequence';

  // Find all remaining invoices sorted chronologically
  const invoices = await Invoice.find().sort({ createdAt: 1, _id: 1 });

  // Phase 1: Temporary numbers to prevent MongoDB unique index collisions
  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    await Invoice.updateOne(
      { _id: inv._id },
      { $set: { invoiceNumber: `TEMP-SEQ-${i + 1}-${inv._id}` } }
    );
  }

  // Phase 2: Assign consecutive 1-based sequence (1, 2, 3...)
  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    const seq = startingNumber + i;
    const finalNumber = String(seq);

    await Invoice.updateOne(
      { _id: inv._id },
      {
        $set: {
          sequenceNumber: seq,
          invoiceNumber: finalNumber,
        },
      }
    );
  }

  // Phase 3: Synchronize atomic sequence counter in DB
  const currentMaxSeq = invoices.length > 0 ? startingNumber + invoices.length - 1 : 0;
  await InvoiceCounter.findOneAndUpdate(
    { identifier },
    { $set: { seq: currentMaxSeq } },
    { upsert: true }
  );
};

export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    const deletedNumber = invoice.invoiceNumber;
    await Invoice.findByIdAndDelete(req.params.id);

    // Resequence remaining invoices continuous 1, 2, 3...
    await resequenceInvoices();

    res.json({
      success: true,
      message: `Invoice ${deletedNumber} deleted and remaining invoice numbers re-sequenced successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


