import { Request, Response } from 'express';
import { Product } from '../models/Product.js';

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
      const products = await Product.find(query).sort({ name: 1 });
      res.json({ success: true, count: products.length, data: products });
      return;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
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

    if (!name || !sku || !category || !size || sellingPrice === undefined) {
      res.status(400).json({
        success: false,
        message: 'Name, SKU, category, size, and selling price are required.',
      });
      return;
    }

    const existingSku = await Product.findOne({ sku: sku.toUpperCase().trim() });
    if (existingSku) {
      res.status(400).json({
        success: false,
        message: `Product with SKU "${sku}" already exists.`,
      });
      return;
    }

    const product = await Product.create({
      name: name.trim(),
      sku: sku.toUpperCase().trim(),
      category,
      size: size.trim(),
      description: description?.trim() || '',
      sellingPrice: Number(sellingPrice),
      imageUrl: imageUrl?.trim() || '',
      status: status || 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
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

    if (sku && sku.toUpperCase().trim() !== product.sku) {
      const existingSku = await Product.findOne({
        sku: sku.toUpperCase().trim(),
        _id: { $ne: product._id },
      });
      if (existingSku) {
        res.status(400).json({
          success: false,
          message: `SKU "${sku}" is already in use by another product.`,
        });
        return;
      }
      product.sku = sku.toUpperCase().trim();
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
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

