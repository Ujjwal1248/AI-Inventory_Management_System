import React, { useState, useEffect } from 'react';
import { getProductInventory } from '../../services/api.js';
import { formatNumber, formatDate, formatRelativeTime } from '../../utils/formatters.js';
import { LoadingSpinner, ErrorState, EmptyState } from '../dashboard/States.jsx';

export default function StockHistoryModal({ isOpen, onClose, product }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true);
      setError(null);
      getProductInventory(product.id)
        .then((res) => setData(res))
        .catch((err) => setError(err.message || 'Failed to load stock movements.'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const renderMovementPill = (type) => {
    switch (type) {
      case 'Stock received':
        return <span className="movement-pill pill-received">📥 Stock received</span>;
      case 'Stock sold':
        return <span className="movement-pill pill-sold">📤 Stock sold</span>;
      case 'Stock returned':
        return <span className="movement-pill pill-returned">🔄 Stock returned</span>;
      default:
        return <span className="movement-pill pill-adjustment">⚙️ Manual adjustment</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3>📜 Stock Movement History</h3>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Audit trail for <strong>{product.name}</strong> ({product.sku})
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: 0 }}>
          {loading && <LoadingSpinner message="Retrieving movement audit trail..." />}

          {error && (
            <div style={{ padding: 24 }}>
              <ErrorState message="Could not load movement log." hint={error} />
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Quick Summary Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  padding: '16px 24px',
                  background: 'var(--color-surface-alt)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Current Stock</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)' }}>
                    {formatNumber(data.stock_quantity)} units
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Minimum Stock Alert</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{data.minimum_stock} units</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Total Recorded Movements</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {data.movements ? data.movements.length : 0} events
                  </div>
                </div>
              </div>

              {/* Movement List */}
              {(!data.movements || data.movements.length === 0) ? (
                <div style={{ padding: 32 }}>
                  <EmptyState message="No recorded stock movements for this product yet." />
                </div>
              ) : (
                <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Type</th>
                        <th>Change</th>
                        <th>Shift (Before → After)</th>
                        <th>Reason / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.movements.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            <div>{formatDate(m.created_at)}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              {formatRelativeTime(m.created_at)}
                            </div>
                          </td>
                          <td>{renderMovementPill(m.movement_type)}</td>
                          <td>
                            <strong
                              style={{
                                color:
                                  m.quantity > 0
                                    ? 'var(--color-success)'
                                    : m.quantity < 0
                                    ? 'var(--color-danger)'
                                    : 'var(--color-text-muted)',
                              }}
                            >
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                            </strong>
                          </td>
                          <td>
                            <span className="shift-badge">
                              <span>{m.previous_stock}</span>
                              <span className="shift-arrow">➔</span>
                              <strong>{m.new_stock}</strong>
                            </span>
                          </td>
                          <td style={{ fontSize: 12.5, color: 'var(--color-text-primary)', maxWidth: 220 }}>
                            {m.reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
