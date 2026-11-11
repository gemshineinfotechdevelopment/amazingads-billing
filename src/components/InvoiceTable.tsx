import React from 'react';
import type { Invoice, InvoiceStatus } from '../types/billing';

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onStatusChange: (id: string, status: InvoiceStatus) => void;
  onDeleteInvoice: (id: string) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  loading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onStatusChange,
  onDeleteInvoice,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-paid">Paid</span>;
      case 'PENDING':
        return <span className="badge badge-pending">Pending</span>;
      case 'OVERDUE':
        return <span className="badge badge-overdue">Overdue</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="table-container">
      {/* Header controls: Search and Filter */}
      <div className="table-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by client, campaign, or invoice ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="filter-group">
          {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => onStatusFilterChange(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice list table */}
      <div className="table-wrapper">
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Client Name</th>
              <th>Ad Campaign / Service</th>
              <th>Amount</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="table-message">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-message">
                  No invoices found matching your criteria.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-mono font-bold">{inv.id}</td>
                  <td className="client-name">{inv.clientName}</td>
                  <td className="campaign-name">{inv.campaignName}</td>
                  <td className="amount font-bold">{formatCurrency(inv.amount)}</td>
                  <td>{inv.issueDate}</td>
                  <td>{inv.dueDate}</td>
                  <td>{statusBadge(inv.status)}</td>
                  <td>
                    <div className="action-buttons">
                      {inv.status !== 'PAID' && (
                        <button
                          className="btn-action btn-mark-paid"
                          onClick={() => onStatusChange(inv.id, 'PAID')}
                          title="Mark as Paid"
                        >
                          Mark Paid
                        </button>
                      )}
                      {inv.status === 'PAID' && (
                        <button
                          className="btn-action btn-mark-pending"
                          onClick={() => onStatusChange(inv.id, 'PENDING')}
                          title="Mark as Pending"
                        >
                          Mark Pending
                        </button>
                      )}
                      <button
                        className="btn-action btn-delete"
                        onClick={() => onDeleteInvoice(inv.id)}
                        title="Delete Invoice"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
