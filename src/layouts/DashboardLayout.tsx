import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { TopNavbar } from '../components/common/TopNavbar';
import { useSettings } from '../context/SettingsContext';

export const DashboardLayout: React.FC = () => {
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      if (saved !== null) return JSON.parse(saved);
      return window.innerWidth >= 768;
    }
    return true;
  });

  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Dynamic Page Title
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Dashboard Overview';
      case '/billing/new':
        return 'New Calendar Billing';
      case '/invoices':
        return 'All Sales Invoices';
      case '/products':
        return 'Calendar Products';
      case '/customers':
        return 'Customer Directory';
      case '/reports':
        return 'Sales & Financial Reports';
      case '/settings':
        return 'System & Company Settings';
      default:
        if (pathname.startsWith('/billing/edit/')) {
          return 'Edit Sales Invoice';
        }
        return `${settings?.companyName || 'Amazing Ads'} - Calendar Billing`;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex">
      {/* Sidebar (Collapsible / Toggleable) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area (Smoothly adjusts margin when sidebar opens/closes) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:pl-64' : 'md:pl-0'
        }`}
      >
        {/* Top Navbar with Open/Close Toggle Button */}
        <TopNavbar
          title={getPageTitle(location.pathname)}
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Page Views */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
