import React from 'react';
import type { BillingStats } from '../types/billing';

interface StatsSummaryProps {
  stats: BillingStats | null;
  loading: boolean;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ stats, loading }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Billed',
      value: stats ? formatCurrency(stats.totalBilled) : '₹0',
      subtitle: `${stats?.totalInvoices || 0} Total Invoices`,
      icon: '💼',
      accentColor: '#3b82f6',
    },
    {
      title: 'Received Amount',
      value: stats ? formatCurrency(stats.paidAmount) : '₹0',
      subtitle: `${stats?.paidCount || 0} Paid Invoices`,
      icon: '💵',
      accentColor: '#10b981',
    },
    {
      title: 'Pending Amount',
      value: stats ? formatCurrency(stats.pendingAmount) : '₹0',
      subtitle: `${stats?.pendingCount || 0} Pending / ${stats?.overdueCount || 0} Overdue`,
      icon: '⏳',
      accentColor: '#f59e0b',
    },
    {
      title: 'Active Clients',
      value: stats ? stats.totalClients.toString() : '0',
      subtitle: 'Across Advertising Channels',
      icon: '👥',
      accentColor: '#8b5cf6',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, index) => (
        <div
          key={index}
          className="stat-card"
          style={{ borderTopColor: card.accentColor }}
        >
          <div className="stat-header">
            <span className="stat-title">{card.title}</span>
            <span className="stat-icon">{card.icon}</span>
          </div>
          <div className="stat-value">
            {loading ? <span className="skeleton-text">Loading...</span> : card.value}
          </div>
          <div className="stat-subtitle">{card.subtitle}</div>
        </div>
      ))}
    </div>
  );
};
