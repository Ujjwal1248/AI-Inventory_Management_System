import React from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { getTopProducts } from '../../services/api.js';
import { LoadingSpinner, ErrorState, EmptyState } from './States.jsx';

export default function TopProductsChart() {
  const { data, loading, error, refetch } = useFetch(getTopProducts);

  const maxSold = data && data.length > 0 ? data[0].total_sold : 1;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Top Selling Products</h3>
          <p>By units sold (all time)</p>
        </div>
        <span className="badge badge-green">🏆 Rankings</span>
      </div>
      <div className="card-body">
        {loading && <LoadingSpinner message="Loading top products..." />}
        {error   && <ErrorState message="Failed to load top products." hint={error} onRetry={refetch} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState message="No sales recorded yet." />
        )}
        {!loading && !error && data && data.length > 0 &&
          data.slice(0, 8).map((product, i) => (
            <div key={product.id} className="top-product-row">
              <div className="top-product-rank">{i + 1}</div>
              <div className="top-product-info">
                <div className="name" title={product.name}>{product.name}</div>
                <div className="cat">{product.category}</div>
              </div>
              <div className="top-product-bar-wrap">
                <div className="top-product-bar-bg">
                  <div
                    className="top-product-bar-fill"
                    style={{ width: `${Math.max(6, (product.total_sold / maxSold) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="top-product-qty">{product.total_sold}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
