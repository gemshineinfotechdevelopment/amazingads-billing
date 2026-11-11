import mongoose, { Schema, Document } from 'mongoose';

export type ProductCategory =
  | 'Gold Foil Calendar'
  | 'Stone Calendar'
  | '5D Calendar'
  | 'Daily Calendar'
  | 'Monthly Calendar'
  | 'Customized Calendar'
  | 'Other Calendars';

export interface IProduct extends Document {
  name: string;
  sku: string;
  category: ProductCategory;
  size: string;
  description?: string;
  sellingPrice: number;
  imageUrl?: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Gold Foil Calendar',
        'Stone Calendar',
        '5D Calendar',
        'Daily Calendar',
        'Monthly Calendar',
        'Customized Calendar',
        'Other Calendars',
      ],
    },
    size: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    sellingPrice: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', sku: 'text' });
productSchema.index({ category: 1, status: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);

