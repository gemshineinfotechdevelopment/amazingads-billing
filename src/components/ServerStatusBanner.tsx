import React from 'react';
import type { HealthResponse } from '../types/billing';

interface ServerStatusBannerProps {
  health: HealthResponse | null;
  error: string | null;
  apiBaseUrl: string;
}

export const ServerStatusBanner: React.FC<ServerStatusBannerProps> = ({
  health,
  error,
  apiBaseUrl,
}) => {
  if (health) {
    return (
      <div className="status-banner banner-success">
        <div className="status-info">
          <span className="status-icon">✅</span>
          <div>
            <strong>Backend Connected:</strong> {health.message}
            <span className="status-meta">
              (URL: <code>{apiBaseUrl}</code> | Env: <code>{health.environment}</code> | Uptime: {health.uptimeSeconds}s)
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-banner banner-warning">
      <div className="status-info">
        <span className="status-icon">⚠️</span>
        <div>
          <strong>Backend Not Connected:</strong> {error || 'Unable to communicate with API server.'}
          <div className="status-subtext">
            Start backend with: <code>npm run dev</code> or <code>npm run dev:server</code> (Target:{' '}
            <code>{apiBaseUrl}</code>)
          </div>
        </div>
      </div>
    </div>
  );
};
