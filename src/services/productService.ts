import { api } from './api';
import type { Product, ProductInput } from '../types/product';

export interface ProductsResponse {
  data: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const productService = {
  async getProducts(params?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
    all?: boolean;
  }): Promise<ProductsResponse> {
    const res = await api.get('/products', { params });
    return res.data;
  },

  async getProductById(id: string): Promise<Product> {
    const res = await api.get(`/products/${id}`);
    return res.data.data;
  },

  async createProduct(data: ProductInput): Promise<Product> {
    const res = await api.post('/products', data);
    return res.data.data;
  },

  async updateProduct(id: string, data: Partial<ProductInput>): Promise<Product> {
    const res = await api.put(`/products/${id}`, data);
    return res.data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};

