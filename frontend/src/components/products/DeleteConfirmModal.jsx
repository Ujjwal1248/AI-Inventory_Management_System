import React, { useState } from 'react';
import { deleteProduct } from '../../services/api.js';

export default function DeleteConfirmModal({ product, isOpen, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteProduct(product.id);
      onDeleted(product.id, `Product "${product.name}" deleted successfully.`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete the product.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🗑️ Delete Product</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="form-error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <p style={{ fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 12 }}>
            Are you sure you want to delete this product?
          </p>

          <div
            style={{
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>
              {product.name}
            </div>
            <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
              SKU: {product.sku} • Stock: {product.stock_quantity} units
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            This action removes the product from active inventory and removes related order line records. This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
