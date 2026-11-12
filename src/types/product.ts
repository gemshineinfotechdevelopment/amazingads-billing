export type ProductCategory =
  | 'Gold Foil Calendar'
  | 'Stone Calendar'
  | '5D Calendar'
  | 'Daily Calendar'
  | 'Monthly Calendar'
  | 'Customized Calendar'
  | 'Other Calendars';

export interface Product {
  _id: string;
  name: string;
  sku: string;
  sequenceNumber?: number;
  category: ProductCategory;
  size: string;
  description?: string;
  sellingPrice: number;
  imageUrl?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  sku: string;
  sequenceNumber?: number;
  category: ProductCategory;
  size: string;
  description?: string;
  sellingPrice: number;
  imageUrl?: string;
  status?: 'Active' | 'Inactive';
}

