import React from 'react';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime } from '../../utils/formatters.js';

export default function SaleReceiptModal({ isOpen, onClose, sale, onNewSale }) {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptDate = sale.created_at ? new Date(sale.created_at) : new Date();
  const formattedTime = receiptDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, background: '#f8fafc' }}
      >
        {/* Header */}
        <div className="modal-header">
          <h3>🧾 Retail Sale Receipt</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close receipt">
            ✕
          </button>
        </div>

        {/* Modal Body / Thermal Paper Receipt */}
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          <div className="receipt-paper">
            {/* Store Branding */}
            <div className="receipt-header">
              <h2>🤖 GEMINI RETAIL STORE</h2>
              <p>AI Retail & Inventory Management</p>
              <p style={{ fontSize: 11 }}>100 Feet Road, Indiranagar, Bengaluru</p>
              <p style={{ fontSize: 11 }}>GSTIN: 29AABCU9603R1ZV</p>
            </div>

            {/* Receipt Meta */}
            <div className="receipt-info-strip">
              <div>
                <div><strong>Receipt #:</strong> {sale.receipt_number || `REC-${String(sale.id).padStart(6, '0')}`}</div>
                <div><strong>Date:</strong> {formatDate(receiptDate)} {formattedTime}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Customer:</strong> {sale.customer_name || 'Walk-in Customer'}</div>
                <div><strong>Payment:</strong> {sale.payment_method || 'Cash'}</div>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items && sale.items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{it.productName || it.product_name}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>SKU: {it.sku}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(it.unit_price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Block */}
            <div className="receipt-total-block">
              <div className="receipt-total-row">
                <span>Subtotal ({sale.totalUnits || sale.items?.reduce((a, b) => a + b.quantity, 0)} units):</span>
                <span>{formatCurrency(sale.total_amount)}</span>
              </div>
              <div className="receipt-total-row">
                <span>Tax (CGST + SGST 18% incl.):</span>
                <span>{formatCurrency(Math.round(sale.total_amount * 0.18 / 1.18))}</span>
              </div>
              <div className="receipt-total-row final">
                <span>TOTAL AMOUNT PAID:</span>
                <span>{formatCurrency(sale.total_amount)}</span>
              </div>
            </div>

            {/* Barcode & Footer */}
            <div className="receipt-footer-msg">
              <div
                style={{
                  letterSpacing: '0.25em',
                  fontFamily: 'monospace',
                  fontSize: 16,
                  fontWeight: 900,
                  margin: '8px 0',
                }}
              >
                ||| | ||||| || |||| ||||| |||
              </div>
              <p style={{ fontWeight: 600 }}>Thank you for shopping with Gemini Retail!</p>
              <p>Items exchangeable within 7 days with original receipt.</p>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn-secondary" onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
          {onNewSale && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onClose();
                onNewSale();
              }}
            >
              ➕ New Sale
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
