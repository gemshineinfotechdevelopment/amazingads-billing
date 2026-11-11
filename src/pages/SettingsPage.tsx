import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  KeyRound,
  User,
  Save,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import type { CompanySettings } from '../types/settings';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, loading } = useSettings();
  const { user, refreshUser } = useAuth();

  // Company & Invoice Settings Form
  const [formData, setFormData] = useState<Partial<CompanySettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Admin Profile Form
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await updateSettings(formData);
      toast.success('Company & Invoice settings saved successfully!');
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await authService.updateProfile(profileName, profileEmail);
      await refreshUser();
      toast.success('Admin profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. Company & Invoice Settings */}
      <form onSubmit={handleSaveCompanySettings} className="space-y-6">
        {/* Company Settings Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="text-base font-bold text-[#142B4A]">Company Information</h3>
              <p className="text-xs text-slate-500">
                Printed on the header of all tax invoices and receipts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / Phone *</label>
              <input
                type="text"
                required
                value={formData.mobile || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Printing Press Address *</label>
            <input
              type="text"
              required
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State (Determines Intra/Inter-state Tax) *
              </label>
              <input
                type="text"
                required
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pincode *</label>
              <input
                type="text"
                required
                value={formData.pincode || ''}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Invoice Settings Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="text-base font-bold text-[#142B4A]">Invoice Configuration</h3>
              <p className="text-xs text-slate-500">
                Numbering format, default tax rates, and printed disclaimers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Invoice Prefix *
              </label>
              <input
                type="text"
                required
                value={formData.invoicePrefix || ''}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. CAL</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Financial Year *
              </label>
              <input
                type="text"
                required
                value={formData.financialYear || ''}
                onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. 2026-27</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Starting Invoice Number *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.startingNumber || 1001}
                onChange={(e) => setFormData({ ...formData, startingNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. 1001</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                value={formData.defaultGstRate || 12}
                onChange={(e) => setFormData({ ...formData, defaultGstRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
              <input
                type="text"
                disabled
                value="INR (₹)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Terms & Conditions (Printed on A4 Invoice)
            </label>
            <textarea
              rows={3}
              value={formData.termsAndConditions || ''}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Invoice Footer Greeting Text
            </label>
            <input
              type="text"
              value={formData.invoiceFooterText || ''}
              onChange={(e) => setFormData({ ...formData, invoiceFooterText: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full sm:w-auto justify-center px-5 py-2.5 bg-[#142B4A] hover:bg-[#1e3c66] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-blue-300" />
              <span>{savingSettings ? 'Saving Settings...' : 'Save Company & Invoice Settings'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* 2. Admin Settings: Profile & Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Profile */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-base font-bold text-[#142B4A]">Admin Profile</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
          >
            {savingProfile ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        {/* Change Password */}
        <form
          onSubmit={handleChangePassword}
          className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-[#142B4A]">Change Password</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Password *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
            <input
              type="password"
              required
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#2563EB] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-2 bg-[#142B4A] hover:bg-[#1e3c66] text-white text-xs font-bold rounded-lg shadow-xs transition"
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
