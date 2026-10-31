import React, { useState, useEffect } from 'react';
import { adjustStock, getProducts } from '../../services/api.js';
import { formatCurrency, formatNumber } from '../../utils/formatters.js';

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  product = null,
  initialAdjustmentType = 'ADD',
  initialQuantity = '',
  initialReason = '',
  onSuccess,
}) {
  const [selectedProduct, setSelectedProduct] = useState(product);
  const [productList, setProductList] = useState([]);
  const [adjustmentType, setAdjustmentType] = useState(initialAdjustmentType);
  const [movementType, setMovementType] = useState('Stock received');
  const [quantity, setQuantity] = useState(initialQuantity);
  const [reason, setReason] = useState(initialReason);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load product list if product is not pre-selected
  useEffect(() => {
    if (!product && isOpen) {
      setLoadingProducts(true);
      getProducts({ limit: 100 })
        .then((res) => {
          setProductList(res.data || []);
          if (res.data && res.data.length > 0 && !selectedProduct) {
            setSelectedProduct(res.data[0]);
          }
        })
        .catch((err) => console.error('Failed to load products for adjustment', err))
        .finally(() => setLoadingProducts(false));
    } else {
      setSelectedProduct(product);
    }
  }, [product, isOpen]);

  // Reset/sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProduct(product);
      setAdjustmentType(initialAdjustmentType);
      setQuantity(initialQuantity || '');
      setReason(initialReason || '');
      setError(null);

      if (initialAdjustmentType === 'ADD') {
        setMovementType('Stock received');
      } else if (initialAdjustmentType === 'REMOVE') {
        setMovementType('Manual adjustment');
      } else {
        setMovementType('Manual adjustment');
      }
    }
  }, [isOpen, product, initialAdjustmentType, initialQuantity, initialReason]);

  if (!isOpen) return null;

  const currentStock = selectedProduct ? selectedProduct.stock_quantity : 0;
  const parsedQty = parseInt(quantity, 10);
  const validQty = !isNaN(parsedQty) && parsedQty >= 0 ? parsedQty : 0;

  // Calculate projected new stock
  let projectedStock = currentStock;
  let netDelta = 0;

  if (adjustmentType === 'ADD') {
    netDelta = validQty;
    projectedStock = currentStock + validQty;
  } else if (adjustmentType === 'REMOVE') {
    netDelta = -validQty;
    projectedStock = currentStock - validQty;
  } else if (adjustmentType === 'SET') {
    netDelta = validQty - currentStock;
    projectedStock = validQty;
  }

  const isNegative = projectedStock < 0;

  const handleProductSelect = (e) => {
    const id = parseInt(e.target.value, 10);
    const found = productList.find((p) => p.id === id);
    if (found) setSelectedProduct(found);
  };

  const handleAdjustmentTypeChange = (type) => {
    setAdjustmentType(type);
    if (type === 'ADD') {
      setMovementType('Stock received');
    } else if (type === 'REMOVE') {
      setMovementType('Manual adjustment');
    } else {
      setMovementType('Manual adjustment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedProduct) {
      setError('Please select a product.');
      return;
    }

    if (quantity === '' || isNaN(parsedQty) || parsedQty < 0) {
      setError('Please enter a valid non-negative quantity.');
      return;
    }

    if (isNegative) {
      setError(`Stock cannot become negative! Current stock is ${currentStock} units; maximum deduction allowed is ${currentStock} units.`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason or note for this stock adjustment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await adjustStock({
        productId: selectedProduct.id,
        adjustmentType,
        movementType,
        quantity: parsedQty,
        reason: reason.trim(),
      });

      onSuccess(res.data, res.message);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header */}
        <div className="modal-header">
          <h3>⚡ Adjust Inventory Stock</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="form-error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Product Selection */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Product to Adjust</label>
            {product ? (
              <div
                style={{
                  background: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div className="product-thumb" style={{ width: 36, height: 36 }}>
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} />
                  ) : (
                    '📦'
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>
                    SKU: {selectedProduct.sku} • Current Stock: <strong>{currentStock} units</strong>
                  </div>
                </div>
              </div>
            ) : (
              <select
                className="select-control"
                style={{ width: '100%' }}
                value={selectedProduct ? selectedProduct.id : ''}
                onChange={handleProductSelect}
                disabled={loadingProducts}
              >
                {loadingProducts && <option>Loading products...</option>}
                {productList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Stock: {p.stock_quantity}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Adjustment Mode Selector */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Adjustment Action</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <button
                type="button"
                className={`btn-secondary ${adjustmentType === 'ADD' ? 'active' : ''}`}
                style={{
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: adjustmentType === 'ADD' ? 'var(--color-success)' : 'var(--color-border)',
                  background: adjustmentType === 'ADD' ? '#f0fdf4' : 'var(--color-surface)',
                  color: adjustmentType === 'ADD' ? '#15803d' : 'var(--color-text-primary)',
                }}
                onClick={() => handleAdjustmentTypeChange('ADD')}
              >
                ➕ Add Stock
              </button>
              <button
                type="button"
                className={`btn-secondary ${adjustmentType === 'REMOVE' ? 'active' : ''}`}
                style={{
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: adjustmentType === 'REMOVE' ? 'var(--color-danger)' : 'var(--color-border)',
                  background: adjustmentType === 'REMOVE' ? '#fef2f2' : 'var(--color-surface)',
                  color: adjustmentType === 'REMOVE' ? '#b91c1c' : 'var(--color-text-primary)',
                }}
                onClick={() => handleAdjustmentTypeChange('REMOVE')}
              >
                ➖ Deduct Stock
              </button>
              <button
                type="button"
                className={`btn-secondary ${adjustmentType === 'SET' ? 'active' : ''}`}
                style={{
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: adjustmentType === 'SET' ? 'var(--color-primary)' : 'var(--color-border)',
                  background: adjustmentType === 'SET' ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  color: adjustmentType === 'SET' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                }}
                onClick={() => handleAdjustmentTypeChange('SET')}
              >
                🎯 Set New Total
              </button>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="adjustment-preview-box">
            <div className="preview-row">
              <span style={{ color: 'var(--color-text-secondary)' }}>Current Stock Level:</span>
              <span className="preview-pill pill-current">{formatNumber(currentStock)} units</span>
            </div>
            <div className="preview-row">
              <span style={{ color: 'var(--color-text-secondary)' }}>Proposed Adjustment:</span>
              <span
                className={`preview-pill ${
                  netDelta > 0
                    ? 'pill-delta-positive'
                    : netDelta < 0
                    ? 'pill-delta-negative'
                    : 'pill-current'
                }`}
              >
                {netDelta > 0 ? `+${netDelta}` : netDelta} units
              </span>
            </div>
            <div className="preview-row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
              <span style={{ fontWeight: 700 }}>Projected New Stock:</span>
              <span
                className="preview-pill pill-target"
                style={{
                  background: isNegative ? '#fee2e2' : undefined,
                  color: isNegative ? '#b91c1c' : undefined,
                }}
              >
                {formatNumber(projectedStock)} units
              </span>
            </div>

            {isNegative && (
              <div className="pill-warning" style={{ marginTop: 4 }}>
                <span>🚫</span>
                <span>
                  <strong>Invalid operation:</strong> Stock cannot become negative! Maximum deductible is{' '}
                  {currentStock} units.
                </span>
              </div>
            )}
          </div>

          <div className="form-grid">
            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">
                {adjustmentType === 'SET' ? 'New Total Stock' : 'Units to Adjust'}{' '}
                <span className="req">*</span>
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder={adjustmentType === 'SET' ? 'e.g. 50' : 'e.g. 10'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {/* Movement Type Classification */}
            <div className="form-group">
              <label className="form-label">
                Movement Classification <span className="req">*</span>
              </label>
              <select
                className="select-control"
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                required
              >
                {adjustmentType === 'ADD' ? (
                  <>
                    <option value="Stock received">Stock received (Supplier shipment / Restock)</option>
                    <option value="Stock returned">Stock returned (Customer return)</option>
                    <option value="Manual adjustment">Manual adjustment (Inventory found / Audit)</option>
                  </>
                ) : adjustmentType === 'REMOVE' ? (
                  <>
                    <option value="Manual adjustment">Manual adjustment (Damage / Expiry / Loss)</option>
                    <option value="Stock sold">Stock sold (Offline POS or direct sale)</option>
                  </>
                ) : (
                  <>
                    <option value="Manual adjustment">Manual adjustment (Cycle count audit)</option>
                  </>
                )}
              </select>
            </div>

            {/* Reason / Notes */}
            <div className="form-group form-full">
              <label className="form-label">
                Adjustment Reason / Note <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Supplier PO delivery, Damaged package write-off, Periodic physical count..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <span className="form-hint">
                Every manual stock movement is logged permanently to the audit trail for compliance.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ margin: '20px -26px -24px -26px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || isNegative || !selectedProduct}
            >
              {submitting ? 'Applying Adjustment...' : 'Apply Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
