import React from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { getRecentSales } from '../../services/api.js';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters.js';
import { LoadingSpinner, ErrorState, EmptyState } from './States.jsx';

export default function RecentSales() {
  const { data, loading, error, refetch } = useFetch(getRecentSales);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Recent Sales</h3>
          <p>Latest customer transactions</p>
        </div>
        <span className="badge badge-green">⚡ Live</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {loading && <LoadingSpinner message="Loading sales..." />}
        {error && <ErrorState message="Could not load recent sales." hint={error} onRetry={refetch} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState message="No transactions recorded yet." />
        )}
        {!loading && !error && data && data.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Items</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((sale) => (
                <tr key={sale.id}>
                  <td style={{ fontWeight: 600 }}>ORD-{String(sale.id).padStart(5, '0')}</td>
                  <td>
                    <span className="badge badge-purple">{sale.itemCount} items</span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {formatRelativeTime(sale.createdAt)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {formatCurrency(sale.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
