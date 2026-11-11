import { api } from './api';
import type { CompanySettings } from '../types/settings';

export const settingsService = {
  async getSettings(): Promise<CompanySettings> {
    const res = await api.get('/settings');
    return res.data.data;
  },

  async updateSettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
    const res = await api.put('/settings', data);
    return res.data.data;
  },
};

