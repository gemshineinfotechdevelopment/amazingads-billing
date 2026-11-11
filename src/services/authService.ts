import { api } from './api';
import type { AdminUser } from '../types/auth';

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; admin: AdminUser }> {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data;
  },

  async getMe(): Promise<AdminUser> {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<string> {
    const res = await api.put('/auth/change-password', { currentPassword, newPassword });
    return res.data.message;
  },

  async updateProfile(name: string, email: string): Promise<AdminUser> {
    const res = await api.put('/auth/profile', { name, email });
    return res.data.data;
  },
};

