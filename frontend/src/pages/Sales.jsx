import React, { useState, useEffect, useCallback } from 'react';
import { getSales, getSaleById, createSale, getProductCategories } from '../services/api.js';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
} from '../utils/formatters.js';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/dashboard/States.jsx';
import ProductPicker from '../components/pos/ProductPicker.jsx';
import CartPanel from '../components/pos/CartPanel.jsx';
import SaleReceiptModal from '../components/pos/SaleReceiptModal.jsx';

export default function Sales() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'history'

  // POS State
  const [cartItems, setCartItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // Completed Receipt Modal State
  const [completedSale, setCompletedSale] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Sales History State
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load categories on mount
  useEffect(() => {
    getProductCategories()
      .then((cats) => setCategories(cats || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch Sales History
  const fetchSalesHistory = useCallback(async () => {
    setLoadingHistory(true);
    setErrorHistory(null);
    try {
      const res = await getSales({
        search: historySearch,
        paymentMethod: paymentFilter !== 'all' ? paymentFilter : '',
        page: historyPage,
        limit: 10,
      });

      setSalesHistory(res.data || []);
      setSalesSummary(res.summary || null);
      setHistoryPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setErrorHistory(err.message || 'Failed to load sales history.');
    } finally {
      setLoadingHistory(false);
    }
  }, [historySearch, paymentFilter, historyPage]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchSalesHistory();
    }
  }, [activeTab, fetchSalesHistory]);

  // Cart operations
  const handleAddToCart = (product) => {
    setCheckoutError(null);
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((line) => line.product.id === product.id);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.quantity >= product.stock_quantity) {
          showToast(`Cannot add more than ${product.stock_quantity} available units of "${product.name}"`, 'error');
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
        return updated;
      } else {
        if (product.stock_quantity <= 0) {
          showToast(`"${product.name}" is out of stock!`, 'error');
          return prev;
        }
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productId, newQty) => {
    setCheckoutError(null);
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((line) => {
        if (line.product.id === productId) {
          const maxStock = line.product.stock_quantity;
          const cappedQty = Math.min(newQty, maxStock);
          return { ...line, quantity: cappedQty };
        }
        return line;
      })
    );
  };

  const handleRemoveItem = (productId) => {
    setCheckoutError(null);
    setCartItems((prev) => prev.filter((line) => line.product.id !== productId));
  };

  const handleClearCart = () => {
    setCheckoutError(null);
    setCartItems([]);
  };

  // Checkout process
  const handleCheckout = async (salePayload) => {
    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await createSale(salePayload);
      setCompletedSale(res.data);
      setIsReceiptOpen(true);
      setCartItems([]);
      showToast(res.message || 'Sale completed successfully!');

      if (activeTab === 'history') {
        fetchSalesHistory();
      }
    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed. Please review stock availability.');
      showToast(err.message || 'Checkout failed', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  // View historical receipt
  const handleViewReceipt = async (saleId) => {
    try {
      const sale = await getSaleById(saleId);
      setCompletedSale(sale);
      setIsReceiptOpen(true);
    } catch (err) {
      showToast('Could not load sale receipt: ' + err.message, 'error');
    }
  };

  return (
    <div>
      {/* Toast Notice */}
      {toast && (
        <div className={`toast-notice ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          <span>🖥️</span>
          <span>POS Register Terminal</span>
          {cartItems.length > 0 && (
            <span className="tab-badge" style={{ background: 'var(--color-primary)', color: '#fff' }}>
              {cartItems.reduce((a, b) => a + b.quantity, 0)} items in cart
            </span>
          )}
        </button>

        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span>📋</span>
          <span>Sales Transactions History</span>
          <span className="tab-badge">{historyPagination.total || 'All Orders'}</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: POS REGISTER TERMINAL                                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'pos' && (
        <div className="pos-layout">
          {/* Left: Product Picker with Search, Barcode Scan, Categories, Cards */}
          <ProductPicker
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            categories={categories}
          />

          {/* Right: Cart, Steppers, Totals, Customer, Checkout */}
          <CartPanel
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            checkingOut={checkingOut}
            checkoutError={checkoutError}
          />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: SALES TRANSACTIONS HISTORY                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div>
          {/* Summary KPIs */}
          {salesSummary && (
            <div className="valuation-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
              <div className="valuation-card">
                <div className="v-label">Total Sales Revenue</div>
                <div className="v-value" style={{ color: 'var(--color-primary)' }}>
                  {formatCurrency(salesSummary.total_revenue)}
                </div>
                <div className="v-sub">Lifetime customer receipts</div>
              </div>

              <div className="valuation-card">
                <div className="v-label">Completed Orders</div>
                <div className="v-value">{formatNumber(salesSummary.total_sales)}</div>
                <div className="v-sub">Transactions recorded</div>
              </div>

              <div className="valuation-card">
                <div className="v-label">Average Ticket Size</div>
                <div className="v-value" style={{ color: 'var(--color-success)' }}>
                  {formatCurrency(salesSummary.avg_ticket_size)}
                </div>
                <div className="v-sub">Per completed transaction</div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="toolbar-card">
            <div className="filter-row">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search orders by receipt number, customer..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                />
              </div>

              <select
                className="select-control"
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setHistoryPage(1);
                }}
              >
                <option value="all">All Payment Methods</option>
                <option value="Cash">💵 Cash</option>
                <option value="Card">💳 Card</option>
                <option value="UPI">📱 UPI</option>
              </select>

              {(historySearch || paymentFilter !== 'all') && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setHistorySearch('');
                    setPaymentFilter('all');
                    setHistoryPage(1);
                  }}
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table Card */}
          <div className="card">
            {loadingHistory && <LoadingSpinner message="Loading sales orders..." />}

            {errorHistory && (
              <ErrorState
                message="Could not load sales history."
                hint={errorHistory}
                onRetry={fetchSalesHistory}
              />
            )}

            {!loadingHistory && !errorHistory && salesHistory.length === 0 && (
              <div style={{ padding: 32 }}>
                <EmptyState message="No sales transactions found matching your criteria." />
              </div>
            )}

            {!loadingHistory && !errorHistory && salesHistory.length > 0 && (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Receipt #</th>
                        <th>Customer</th>
                        <th>Payment</th>
                        <th>Items</th>
                        <th>Total Amount</th>
                        <th>Date & Time</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesHistory.map((order) => (
                        <tr key={order.id}>
                          {/* Receipt # */}
                          <td>
                            <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                              {order.receipt_number}
                            </strong>
                          </td>

                          {/* Customer */}
                          <td>
                            <span style={{ fontWeight: 600 }}>{order.customer_name}</span>
                          </td>

                          {/* Payment Method */}
                          <td>
                            <span
                              className="badge"
                              style={{
                                background:
                                  order.payment_method === 'Cash'
                                    ? '#f0fdf4'
                                    : order.payment_method === 'Card'
                                    ? '#eff6ff'
                                    : '#faf5ff',
                                color:
                                  order.payment_method === 'Cash'
                                    ? '#15803d'
                                    : order.payment_method === 'Card'
                                    ? '#1d4ed8'
                                    : '#7e22ce',
                              }}
                            >
                              {order.payment_method === 'Cash'
                                ? '💵 Cash'
                                : order.payment_method === 'Card'
                                ? '💳 Card'
                                : '📱 UPI'}
                            </span>
                          </td>

                          {/* Items / Units */}
                          <td>
                            <span className="badge badge-purple">
                              {order.item_count} items ({order.total_units} units)
                            </span>
                          </td>

                          {/* Total Amount */}
                          <td style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
                            {formatCurrency(order.total_amount)}
                          </td>

                          {/* Date */}
                          <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            <div>{formatDate(order.created_at)}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              {formatRelativeTime(order.created_at)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn-sm btn-adjust"
                              onClick={() => handleViewReceipt(order.id)}
                              title="View and reprint sales receipt"
                            >
                              🧾 View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="pagination-wrapper">
                  <div>
                    Page <strong>{historyPagination.page}</strong> of{' '}
                    <strong>{historyPagination.totalPages}</strong> ({historyPagination.total} total orders)
                  </div>
                  <div className="pagination-buttons">
                    <button
                      className="page-btn"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPagination.page <= 1}
                    >
                      ← Previous
                    </button>
                    <button
                      className="page-btn"
                      onClick={() => setHistoryPage((p) => Math.min(historyPagination.totalPages, p + 1))}
                      disabled={historyPagination.page >= historyPagination.totalPages}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sale Receipt Modal (Printable) */}
      <SaleReceiptModal
        isOpen={isReceiptOpen}
        sale={completedSale}
        onClose={() => setIsReceiptOpen(false)}
        onNewSale={() => {
          setIsReceiptOpen(false);
          setActiveTab('pos');
        }}
      />
    </div>
  );
}
