import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Printer,
  PanelLeftClose,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { settings } = useSettings();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'New Billing', path: '/billing/new', icon: FilePlus },
    { name: 'All Invoices', path: '/invoices', icon: FileText },
    { name: 'Products', path: '/products', icon: Calendar },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden print-hide transition-opacity"
          onClick={onClose}
          aria-label="Close sidebar backdrop"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen h-[100dvh] w-64 bg-[#142B4A] text-white flex flex-col transition-transform duration-300 ease-in-out print-hide shadow-xl md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header & Close Button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 truncate">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2563EB] text-white shadow-md shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h1 className="font-bold text-sm leading-tight tracking-wide text-white truncate max-w-[130px]">
                {settings?.companyName || 'Amazing Ads'}
              </h1>
              <span className="text-[10px] text-blue-200 tracking-wider uppercase font-semibold">
                Calendar Billing
              </span>
            </div>
          </div>

          {/* Sidebar Close / Collapse Button */}
          <button
            onClick={onClose}
            title="Close / Hide Sidebar"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition flex items-center justify-center shrink-0"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links (7 required modules) */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-blue-300/70">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  // On mobile screens, automatically close drawer after navigating
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    onClose();
                  }
                }}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
          <span className="truncate">{settings?.companyName ? `${settings.companyName} System` : 'Amazing Ads System'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="System Online"></span>
        </div>
      </aside>
    </>
  );
};
