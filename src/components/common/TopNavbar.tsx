import React from 'react';
import { Menu, LogOut, User, PlusCircle, PanelLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

interface TopNavbarProps {
  onMenuClick: () => void;
  title: string;
  sidebarOpen?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onMenuClick,
  title,
  sidebarOpen = true,
}) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-3 sm:px-4 md:px-8 flex items-center justify-between shadow-xs print-hide">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Universal Sidebar Open / Close Button (Desktop & Mobile) */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-700 hover:text-[#2563EB] hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition flex items-center justify-center gap-1.5 group shadow-2xs shrink-0"
          title={sidebarOpen ? 'Close / Collapse Sidebar' : 'Open / Expand Sidebar'}
          aria-label="Toggle Sidebar"
        >
          {sidebarOpen ? (
            <PanelLeft className="w-5 h-5 text-slate-600 group-hover:text-[#2563EB] transition" />
          ) : (
            <Menu className="w-5 h-5 text-[#2563EB]" />
          )}
          <span className="hidden sm:inline text-xs font-semibold text-slate-600 group-hover:text-[#2563EB]">
            {sidebarOpen ? 'Collapse' : 'Menu'}
          </span>
        </button>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base md:text-xl font-bold text-[#142B4A] tracking-tight truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-none">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick New Billing Button (Desktop & Mobile) */}
        <Link
          to="/billing/new"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs md:text-sm font-semibold hover:bg-blue-700 transition shadow-xs"
          title="Create New Calendar Bill"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden xs:inline">New Bill</span>
        </Link>

        {/* Company State Pill */}
        {settings?.state && (
          <div className="hidden lg:flex items-center px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600 border border-slate-200">
            <span>State: {settings.state}</span>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-full bg-[#142B4A]/10 text-[#142B4A] flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-500">{user?.email || 'admin@calendar.com'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
