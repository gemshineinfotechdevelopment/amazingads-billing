import React from 'react';

interface NavbarProps {
  appTitle?: string;
  isBackendConnected: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  appTitle = 'Amazing Ads Billing',
  isBackendConnected,
  onRefresh,
  onOpenCreateModal,
}) => {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="brand-logo">
          <span className="logo-icon">📊</span>
          <span className="brand-name">{appTitle}</span>
        </div>
        <span className="brand-badge">PRO</span>
      </div>

      <div className="navbar-actions">
        <div
          className={`connection-indicator ${
            isBackendConnected ? 'connected' : 'disconnected'
          }`}
          title={isBackendConnected ? 'Connected to backend server' : 'Backend server offline'}
        >
          <span className="dot"></span>
          <span>{isBackendConnected ? 'Backend Online' : 'Backend Offline'}</span>
        </div>

        <button className="btn-secondary" onClick={onRefresh} title="Refresh Data">
          🔄 Refresh
        </button>

        <button className="btn-primary" onClick={onOpenCreateModal}>
          ➕ New Invoice
        </button>
      </div>
    </header>
  );
};

