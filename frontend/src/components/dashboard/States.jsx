import React from 'react';

/**
 * LoadingSpinner — shown while data is being fetched.
 */
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-wrapper">
      <div className="spinner" />
      <span className="loading-text">{message}</span>
    </div>
  );
}

/**
 * ErrorState — shown when an API call fails.
 */
export function ErrorState({ message, hint, onRetry }) {
  return (
    <div className="error-wrapper">
      <div className="error-icon">⚠️</div>
      <p className="error-message">{message}</p>
      {hint && <p className="error-hint">{hint}</p>}
      {onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * EmptyState — shown when an API returns no data.
 */
export function EmptyState({ message = 'No data available yet.' }) {
  return (
    <div className="empty-wrapper">
      <div className="empty-icon">📭</div>
      <p className="empty-message">{message}</p>
    </div>
  );
}
