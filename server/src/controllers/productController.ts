import { Request, Response } from 'express';
import { Product } from '../models/Product.js';

/**
 * Re-indexes all products with continuous sequential SKU numbers: 1, 2, 3, ...
 * When any product is deleted or added, this guarantees no gaps in sequence:
 * product 1 is deleted -> product 2 becomes 1, product 3 becomes 2, etc.
 */
export const resequenceProducts = async (): Promise<void> => {
  const products = await Product.find().sort({ sequenceNumber: 1, createdAt: 1, _id: 1 });
  if (products.length === 0) return;

  const now = Date.now();
  // Pass 1: Set temporary SKUs to prevent MongoDB unique key constraint collisions
  for (let i = 0; i < products.length; i++) {
    await Product.updateOne(
      { _id: products[i]._id },
      { $set: { sku: `__TEMP_${now}_${i}__` } }
    );
  }

  // Pass 2: Set exact 1-based sequential SKUs: "1", "2", "3", ...
  for (let i = 0; i < products.length; i++) {
    const seq = i + 1;
    await Product.updateOne(
      { _id: products[i]._id },
      { $set: { sku: String(seq), sequenceNumber: seq } }
    );
  }
};

/**
 * Peek upcoming product SKU code (starts at 1 for first product)
 */
export const getNextProductSkuPreview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await Product.countDocuments();
    const nextSku = String(count + 1);
    res.json({
      success: true,
      data: {
        nextSku,
        sequenceNumber: count + 1,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, status, page = 1, limit = 10, all } = req.query;

    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search) {
      const q = String(search).trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
      ];
    }

    // If 'all=true' is passed (e.g. for billing dropdowns), return all active products without pagination
    if (all === 'true') {
      const products = await Product.find(query).sort({ sequenceNumber: 1, createdAt: 1 });
      res.json({ success: true, count: products.length, data: products });
      return;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ sequenceNumber: 1, createdAt: 1 }).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
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

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, sku, category, size, description, sellingPrice, imageUrl, status } = req.body;

    if (!name || !category || !size || sellingPrice === undefined) {
      res.status(400).json({
        success: false,
        message: 'Name, category, size, and selling price are required.',
      });
      return;
    }

    const count = await Product.countDocuments();
    const nextSeq = count + 1;
    // Always assign sequential SKU starting from 1 (or provided sequential number)
    const assignedSku = sku && !isNaN(Number(sku)) ? String(Number(sku)) : String(nextSeq);

    const product = await Product.create({
      name: name.trim(),
      sku: assignedSku,
      sequenceNumber: nextSeq,
      category,
      size: size.trim(),
      description: description?.trim() || '',
      sellingPrice: Number(sellingPrice),
      imageUrl: imageUrl?.trim() || '',
      status: status || 'Active',
    });

    // Re-sequence to ensure continuous 1, 2, 3... order with no gaps
    await resequenceProducts();

    const savedProduct = await Product.findById(product._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct || product,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, sku, category, size, description, sellingPrice, imageUrl, status } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    if (name) product.name = name.trim();
    if (category) product.category = category;
    if (size) product.size = size.trim();
    if (description !== undefined) product.description = description.trim();
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (imageUrl !== undefined) product.imageUrl = imageUrl.trim();
    if (status) product.status = status;

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    // Automatically re-sequence remaining products so sequence remains 1, 2, 3, ...
    // E.g. If product 1 is deleted, product 2 becomes 1, product 3 becomes 2, etc.
    await resequenceProducts();

    res.json({
      success: true,
      message: 'Product deleted successfully and product sequence re-indexed from 1.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

