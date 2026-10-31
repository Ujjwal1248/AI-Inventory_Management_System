import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters.js';

export default function CartPanel({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  checkingOut,
  checkoutError,
}) {
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const totalUnits = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.product.selling_price, 0);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    onCheckout({
      customerName: customerName.trim() || 'Walk-in Customer',
      paymentMethod,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    });
  };

  return (
    <div className="pos-cart-panel">
      {/* Header */}
      <div className="cart-header">
        <h3>
          <span>🛒</span>
          <span>Current Sale Cart</span>
          {cartItems.length > 0 && (
            <span className="badge badge-blue">{totalUnits} items</span>
          )}
        </h3>
        {cartItems.length > 0 && (
          <button
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={onClearCart}
            title="Empty all items from cart"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="cart-items-list">
        {cartItems.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 10,
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              padding: '30px 16px',
            }}
          >
            <div style={{ fontSize: 44, opacity: 0.4 }}>🛒</div>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-secondary)' }}>
              Cart is currently empty
            </p>
            <p style={{ fontSize: 12 }}>
              Click products in the catalogue or scan a barcode to start ringing up a sale.
            </p>
          </div>
        ) : (
          cartItems.map((line) => {
            const availableStock = line.product.stock_quantity;
            const atMaxStock = line.quantity >= availableStock;

            return (
              <div key={line.product.id} className="cart-line-item">
                <div className="cart-line-info">
                  <div className="cart-line-name" title={line.product.name}>
                    {line.product.name}
                  </div>
                  <div className="cart-line-price">
                    {formatCurrency(line.product.selling_price)} each • Max: {availableStock}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="cart-stepper">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(line.product.id, line.quantity - 1)}
                    title="Decrease quantity"
                  >
                    –
                  </button>
                  <span className="cart-stepper-value">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(line.product.id, line.quantity + 1)}
                    disabled={atMaxStock}
                    title={atMaxStock ? 'Cannot exceed available stock' : 'Increase quantity'}
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div className="cart-line-subtotal">
                  {formatCurrency(line.quantity * line.product.selling_price)}
                </div>

                {/* Remove Line */}
                <button
                  type="button"
                  className="cart-line-del"
                  onClick={() => onRemoveItem(line.product.id)}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Checkout Section */}
      {cartItems.length > 0 && (
        <form onSubmit={handleCheckoutSubmit} className="cart-checkout-section">
          {checkoutError && (
            <div className="form-error-banner" style={{ margin: 0, padding: '8px 12px' }}>
              <span>⚠️</span>
              <span style={{ fontSize: 12 }}>{checkoutError}</span>
            </div>
          )}

          {/* Customer Input */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Customer Name</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '7px 10px', fontSize: 13 }}
              placeholder="e.g. Walk-in Customer, Rahul..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {/* Payment Method Selector */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Payment Method</label>
            <div className="payment-options-grid">
              {['Cash', 'Card', 'UPI'].map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`payment-pill-btn ${paymentMethod === method ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method)}
                >
                  <span>{method === 'Cash' ? '💵' : method === 'Card' ? '💳' : '📱'}</span>
                  <span>{method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subtotal & Total */}
          <div className="cart-total-row">
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
              Subtotal ({totalUnits} units):
            </span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
          </div>

          <div className="cart-total-row grand-total">
            <span>Total Payable:</span>
            <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(subtotal)}</span>
          </div>

          {/* Complete Checkout Button */}
          <button
            type="submit"
            className="btn-checkout"
            disabled={checkingOut || cartItems.length === 0}
          >
            <span>⚡</span>
            <span>{checkingOut ? 'Processing Transaction...' : `Complete Sale • ${formatCurrency(subtotal)}`}</span>
          </button>
        </form>
      )}
    </div>
  );
}
