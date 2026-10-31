import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/api.js';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  getStockStatusClass,
  getStockStatusLabel,
} from '../utils/formatters.js';
import { LoadingSpinner, ErrorState } from '../components/dashboard/States.jsx';
import ProductFormModal from '../components/products/ProductFormModal.jsx';
import DeleteConfirmModal from '../components/products/DeleteConfirmModal.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductById(id);
      setProduct(data);
    } catch (err) {
      setError(err.message || 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading product details..." />;
  }

  if (error || !product) {
    return (
      <div className="card" style={{ marginTop: 20 }}>
        <ErrorState
          message="Could not find product."
          hint={error || 'The requested product does not exist or was deleted.'}
          onRetry={loadProduct}
        />
        <div style={{ textAlign: 'center', paddingBottom: 24 }}>
          <Link to="/products" className="btn-secondary">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const grossProfit = product.selling_price - product.cost_price;

  return (
    <div>
      {/* Toast Notice */}
      {toast && (
        <div className={`toast-notice ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header and Navigation */}
      <div className="details-header">
        <div>
          <Link to="/products" className="back-link">
            ← Back to Product Catalogue
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {product.name}
            </h2>
            <span className={`badge ${getStockStatusClass(product.stock_status)}`}>
              {getStockStatusLabel(product.stock_status)}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
            SKU: <strong style={{ color: 'var(--color-text-primary)' }}>{product.sku}</strong> • Category: <strong style={{ color: 'var(--color-text-primary)' }}>{product.category}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => setIsEditOpen(true)}>
            ✏️ Edit Product
          </button>
          <button className="btn-danger" onClick={() => setIsDeleteOpen(true)}>
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Main 2-column Layout */}
      <div className="details-grid">
        {/* Left Column: Image & Essential Specifications */}
        <div className="details-hero-card">
          <div className="details-image-box">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerText = '📦';
                }}
              />
            ) : (
              '📦'
            )}
          </div>

          <div className="details-spec-list">
            <div className="spec-item">
              <span className="spec-label">SKU Code</span>
              <span className="spec-val" style={{ fontFamily: 'monospace' }}>{product.sku}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Barcode / UPC</span>
              <span className="spec-val" style={{ fontFamily: 'monospace' }}>
                {product.barcode || 'Not assigned'}
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Supplier</span>
              <span className="spec-val">{product.supplier || 'Direct Supplier'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Added On</span>
              <span className="spec-val">{formatDate(product.created_at)}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Last Modified</span>
              <span className="spec-val">{formatRelativeTime(product.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Financials, Stock Health, Sales Stats, Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top 3 Metric Cards */}
          <div className="stats-card-group">
            {/* Selling Price */}
            <div className="stat-metric-card">
              <div className="label">Selling Price</div>
              <div className="value" style={{ color: 'var(--color-primary)' }}>
                {formatCurrency(product.selling_price)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                Cost: {formatCurrency(product.cost_price)}
              </div>
            </div>

            {/* Profit Margin */}
            <div className="stat-metric-card">
              <div className="label">Profit Margin</div>
              <div
                className="value"
                style={{
                  color:
                    product.margin_percent >= 25
                      ? 'var(--color-success)'
                      : product.margin_percent >= 10
                      ? 'var(--color-warning)'
                      : 'var(--color-danger)',
                }}
              >
                {product.margin_percent}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                +{formatCurrency(grossProfit)} profit / unit
              </div>
            </div>

            {/* Total Valuation */}
            <div className="stat-metric-card">
              <div className="label">Inventory Value</div>
              <div className="value">
                {formatCurrency(product.inventory_value)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                {formatNumber(product.stock_quantity)} units in stock
              </div>
            </div>
          </div>

          {/* Stock Health Card */}
          <div className="card">
            <div className="card-header">
              <h3>📦 Stock Level & Availability</h3>
              <span className={`badge ${getStockStatusClass(product.stock_status)}`}>
                {getStockStatusLabel(product.stock_status)}
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Current Stock: <strong>{formatNumber(product.stock_quantity)} units</strong>
                </span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Minimum Threshold: <strong>{product.minimum_stock} units</strong>
                </span>
              </div>

              {/* Stock Bar */}
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (product.stock_quantity / Math.max(1, product.minimum_stock * 2)) * 100)}%`,
                    background:
                      product.stock_quantity === 0
                        ? 'var(--color-danger)'
                        : product.stock_quantity <= product.minimum_stock
                        ? 'var(--color-warning)'
                        : 'var(--color-success)',
                    borderRadius: 99,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 10 }}>
                {product.stock_quantity === 0 ? (
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                    ⚠️ This product is completely out of stock. Customers cannot purchase this item.
                  </span>
                ) : product.stock_quantity <= product.minimum_stock ? (
                  <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                    ⚠️ Stock is at or below minimum reorder level ({product.minimum_stock} units). Consider placing a supplier order.
                  </span>
                ) : (
                  <span>
                    ✅ Stock level is healthy and sufficient to meet regular customer demand.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sales Performance Card */}
          <div className="card">
            <div className="card-header">
              <h3>📈 Sales Performance Summary</h3>
              <span className="badge badge-purple">Real-Time Data</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Total Sold</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                    {formatNumber(product.salesStats?.units_sold || 0)} units
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Total Revenue</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--color-primary)' }}>
                    {formatCurrency(product.salesStats?.total_revenue || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Orders Containing Item</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                    {formatNumber(product.salesStats?.orders_count || 0)} orders
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="card">
            <div className="card-header">
              <h3>📝 Product Description</h3>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                {product.description || 'No detailed description provided for this product.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ProductFormModal
        isOpen={isEditOpen}
        product={product}
        onClose={() => setIsEditOpen(false)}
        onSaved={(updated) => {
          setProduct((prev) => ({ ...prev, ...updated }));
          showToast('Product updated successfully!');
        }}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        product={product}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => {
          navigate('/products', { replace: true });
        }}
      />
    </div>
  );
}
