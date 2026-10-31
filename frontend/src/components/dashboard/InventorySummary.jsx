import React from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { getInventorySummary } from '../../services/api.js';
import { formatCurrency, formatNumber } from '../../utils/formatters.js';
import { LoadingSpinner, ErrorState, EmptyState } from './States.jsx';

export default function InventorySummary() {
  const { data, loading, error, refetch } = useFetch(getInventorySummary);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Category Inventory Summary</h3>
          <p>Valuation and stock health per category</p>
        </div>
        <span className="badge badge-blue">📊 Breakdown</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {loading && <LoadingSpinner message="Calculating summary..." />}
        {error && <ErrorState message="Could not load summary." hint={error} onRetry={refetch} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState message="No category data available." />
        )}
        {!loading && !error && data && data.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Total Stock</th>
                <th>Avg. Price</th>
                <th>Stock Health</th>
                <th style={{ textAlign: 'right' }}>Inventory Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((cat) => (
                <tr key={cat.category}>
                  <td style={{ fontWeight: 600 }}>{cat.category}</td>
                  <td>{cat.product_count} items</td>
                  <td>{formatNumber(cat.total_stock)} units</td>
                  <td>{formatCurrency(cat.avgPrice)}</td>
                  <td>
                    {cat.out_of_stock > 0 && (
                      <span className="badge status-out-of-stock" style={{ marginRight: 6 }}>
                        {cat.out_of_stock} out
                      </span>
                    )}
                    {cat.low_stock > 0 && (
                      <span className="badge status-low-stock" style={{ marginRight: 6 }}>
                        {cat.low_stock} low
                      </span>
                    )}
                    {cat.out_of_stock === 0 && cat.low_stock === 0 && (
                      <span className="badge status-in-stock">All Optimal</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {formatCurrency(cat.inventoryValue)}
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
