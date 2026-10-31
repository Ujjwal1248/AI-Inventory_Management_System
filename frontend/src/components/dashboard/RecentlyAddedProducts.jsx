import React from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import { getRecentProducts } from '../../services/api.js';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters.js';
import { LoadingSpinner, ErrorState, EmptyState } from './States.jsx';

export default function RecentlyAddedProducts() {
  const { data, loading, error, refetch } = useFetch(getRecentProducts);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Recently Added Products</h3>
          <p>New arrivals to the inventory catalogue</p>
        </div>
        <Link to="/products" className="card-link">
          Manage products →
        </Link>
      </div>
      <div className="card-body">
        {loading && <LoadingSpinner message="Loading products..." />}
        {error && <ErrorState message="Could not load products." hint={error} onRetry={refetch} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState message="No products added yet." />
        )}
        {!loading && !error && data && data.length > 0 && (
          <div>
            {data.slice(0, 6).map((item) => (
              <div key={item.id} className="product-list-item">
                <div className="product-avatar">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerText = '📦';
                      }}
                    />
                  ) : (
                    '📦'
                  )}
                </div>
                <div className="product-info">
                  <Link
                    to={`/products/${item.id}`}
                    className="name"
                    title={item.name}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {item.name}
                  </Link>
                  <div className="sku">{item.sku} • {item.category} • added {formatRelativeTime(item.created_at)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="product-price">{formatCurrency(item.sellingPrice || item.selling_price)}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {item.stock_quantity} in stock
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
