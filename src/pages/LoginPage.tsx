import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@calendar.com');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);
      toast.success('Welcome back, Administrator!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and App Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#142B4A] text-white shadow-lg mb-3">
            <Printer className="w-6 h-6 sm:w-7 sm:h-7 text-[#2563EB]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#142B4A] tracking-tight">
            Calendar Printing Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Amazing Ads • Professional Invoicing System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Admin Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to access the billing dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@calendar.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 bg-[#142B4A] hover:bg-[#1e3c66] text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Signing in...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials pill */}
          <div className="mt-6 p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
            <span className="font-bold">Default Credentials:</span>
            <div className="flex justify-between mt-1 text-[11px] text-blue-800">
              <span>Email: <code>admin@calendar.com</code></span>
              <span>Pass: <code>admin123</code></span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Amazing Ads © 2026. Secure Access Only.
        </p>
      </div>
    </div>
  );
};

