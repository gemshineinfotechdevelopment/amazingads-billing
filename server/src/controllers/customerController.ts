import { Request, Response } from 'express';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = 1, limit = 10, all } = req.query;

    const query: any = {};

    if (search) {
      const q = String(search).trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
      ];
    }

    if (all === 'true') {
      const customers = await Customer.find(query).sort({ name: 1 });
      res.json({ success: true, count: customers.length, data: customers });
      return;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: customers,
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

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    // Also fetch customer's invoice summary
    const invoices = await Invoice.find({ customer: customer._id }).sort({ invoiceDate: -1 });

    res.json({
      success: true,
      data: {
        customer,
        invoices,
        invoiceCount: invoices.length,
        totalBilled: invoices
          .filter((i) => i.status === 'Active')
          .reduce((sum, i) => sum + i.grandTotal, 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, mobile, email, companyName, gstin, billingAddress, city, state, pincode } =
      req.body;

    if (!name || !mobile || !billingAddress || !city || !state || !pincode) {
      res.status(400).json({
        success: false,
        message: 'Name, mobile, billing address, city, state, and pincode are required.',
      });
      return;
    }

    const customer = await Customer.create({
      name: name.trim(),
      mobile: mobile.trim(),
      email: email?.trim() || '',
      companyName: companyName?.trim() || '',
      gstin: gstin?.toUpperCase().trim() || '',
      billingAddress: billingAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, mobile, email, companyName, gstin, billingAddress, city, state, pincode } =
      req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    if (name) customer.name = name.trim();
    if (mobile) customer.mobile = mobile.trim();
    if (email !== undefined) customer.email = email.trim();
    if (companyName !== undefined) customer.companyName = companyName.trim();
    if (gstin !== undefined) customer.gstin = gstin.toUpperCase().trim();
    if (billingAddress) customer.billingAddress = billingAddress.trim();
    if (city) customer.city = city.trim();
    if (state) customer.state = state.trim();
    if (pincode) customer.pincode = pincode.trim();

    await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if customer has invoices
    const invoiceCount = await Invoice.countDocuments({ customer: req.params.id });
    if (invoiceCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete customer with ${invoiceCount} existing invoices. You can archive or keep customer for record.`,
      });
      return;
    }

    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

