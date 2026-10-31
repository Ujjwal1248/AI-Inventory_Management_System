import React from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import { getLowStock } from '../../services/api.js';
import { formatCurrency, getStockStatusClass, getStockStatusLabel } from '../../utils/formatters.js';
import { LoadingSpinner, ErrorState, EmptyState } from './States.jsx';

export default function LowStockProducts() {
  const { data, loading, error, refetch } = useFetch(getLowStock);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Low-Stock Alert</h3>
          <p>Items needing immediate replenishment</p>
        </div>
        <Link to="/products?stockStatus=low_stock" className="card-link">
          View all →
        </Link>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {loading && <LoadingSpinner message="Checking stock..." />}
        {error && <ErrorState message="Could not check stock levels." hint={error} onRetry={refetch} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState message="All products are sufficiently stocked!" />
        )}
        {!loading && !error && data && data.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Min</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 6).map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link
                      to={`/products/${item.id}`}
                      style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}
                    >
                      {item.name}
                    </Link>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.sku}</div>
                  </td>
                  <td>
                    <span className="badge badge-blue">{item.category}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: item.stock_quantity === 0 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                    {item.stock_quantity}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{item.minimum_stock}</td>
                  <td>
                    <span className={`badge ${getStockStatusClass(item.stock_status)}`}>
                      {getStockStatusLabel(item.stock_status)}
                    </span>
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
