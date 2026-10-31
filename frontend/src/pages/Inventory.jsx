import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getInventory,
  getStockMovements,
  getLowStockInventory,
  getProductCategories,
} from '../services/api.js';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  getStockStatusClass,
  getStockStatusLabel,
} from '../utils/formatters.js';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/dashboard/States.jsx';
import StockAdjustmentModal from '../components/inventory/StockAdjustmentModal.jsx';
import StockHistoryModal from '../components/inventory/StockHistoryModal.jsx';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock', 'movements', 'lowStock'

  // Tab 1 (Stock) State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [sortField, setSortField] = useState('stock_quantity');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [inventoryData, setInventoryData] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loadingStock, setLoadingStock] = useState(true);
  const [errorStock, setErrorStock] = useState(null);

  // Tab 2 (Movements) State
  const [movementsData, setMovementsData] = useState([]);
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const [movementSearch, setMovementSearch] = useState('');
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsPagination, setMovementsPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [errorMovements, setErrorMovements] = useState(null);

  // Tab 3 (Low Stock) State
  const [lowStockList, setLowStockList] = useState([]);
  const [loadingLowStock, setLoadingLowStock] = useState(false);
  const [errorLowStock, setErrorLowStock] = useState(null);

  // Modals state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetProduct, setAdjustTargetProduct] = useState(null);
  const [adjustInitialType, setAdjustInitialType] = useState('ADD');
  const [adjustInitialQty, setAdjustInitialQty] = useState('');
  const [adjustInitialReason, setAdjustInitialReason] = useState('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTargetProduct, setHistoryTargetProduct] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load category list on mount
  useEffect(() => {
    getProductCategories()
      .then((cats) => setCategories(cats || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch Inventory List
  const fetchInventoryList = useCallback(async () => {
    setLoadingStock(true);
    setErrorStock(null);
    try {
      const res = await getInventory({
        search,
        category: category !== 'all' ? category : '',
        stockStatus: stockStatus !== 'all' ? stockStatus : '',
        sortBy: sortField,
        sortOrder,
        page,
        limit,
      });

      setInventoryData(res.data || []);
      setSummaryMetrics(res.summary || null);
      setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setErrorStock(err.message || 'Failed to load inventory.');
    } finally {
      setLoadingStock(false);
    }
  }, [search, category, stockStatus, sortField, sortOrder, page, limit]);

  useEffect(() => {
    if (activeTab === 'stock') {
      fetchInventoryList();
    }
  }, [activeTab, fetchInventoryList]);

  // Fetch Movements Log
  const fetchMovements = useCallback(async () => {
    setLoadingMovements(true);
    setErrorMovements(null);
    try {
      const res = await getStockMovements({
        movementType: movementTypeFilter !== 'all' ? movementTypeFilter : '',
        search: movementSearch,
        page: movementsPage,
        limit: 15,
      });
      setMovementsData(res.data || []);
      setMovementsPagination(res.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
    } catch (err) {
      setErrorMovements(err.message || 'Failed to load stock movements.');
    } finally {
      setLoadingMovements(false);
    }
  }, [movementTypeFilter, movementSearch, movementsPage]);

  useEffect(() => {
    if (activeTab === 'movements') {
      fetchMovements();
    }
  }, [activeTab, fetchMovements]);

  // Fetch Low Stock Watchlist
  const fetchLowStockWatchlist = useCallback(async () => {
    setLoadingLowStock(true);
    setErrorLowStock(null);
    try {
      const res = await getLowStockInventory();
      setLowStockList(res.data || []);
    } catch (err) {
      setErrorLowStock(err.message || 'Failed to load low stock inventory.');
    } finally {
      setLoadingLowStock(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'lowStock') {
      fetchLowStockWatchlist();
    }
  }, [activeTab, fetchLowStockWatchlist]);

  // Handle Adjustment Success
  const handleAdjustmentSuccess = (updatedData, message) => {
    showToast(message, 'success');
    fetchInventoryList();
    if (activeTab === 'movements') fetchMovements();
    if (activeTab === 'lowStock') fetchLowStockWatchlist();
  };

  // Open adjustment modal for a specific product
  const handleOpenAdjustForProduct = (product, initialType = 'ADD', defaultQty = '', defaultReason = '') => {
    setAdjustTargetProduct(product);
    setAdjustInitialType(initialType);
    setAdjustInitialQty(defaultQty ? String(defaultQty) : '');
    setAdjustInitialReason(defaultReason);
    setIsAdjustModalOpen(true);
  };

  // Open history modal for a product
  const handleOpenHistory = (product) => {
    setHistoryTargetProduct(product);
    setIsHistoryModalOpen(true);
  };

  // Render movement type badges
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
    <div>
      {/* Toast Notice */}
      {toast && (
        <div className={`toast-notice ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Inventory Valuation & Stock Summary (6 Cards) */}
      {summaryMetrics && (
        <div className="valuation-grid">
          {/* Cost Valuation */}
          <div className="valuation-card">
            <div className="v-label">Cost Valuation</div>
            <div className="v-value" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(summaryMetrics.totalCostValuation)}
            </div>
            <div className="v-sub">Capital tied in inventory</div>
          </div>

          {/* Retail Valuation */}
          <div className="valuation-card">
            <div className="v-label">Retail Valuation</div>
            <div className="v-value" style={{ color: 'var(--color-text-primary)' }}>
              {formatCurrency(summaryMetrics.totalRetailValuation)}
            </div>
            <div className="v-sub">At expected selling price</div>
          </div>

          {/* Potential Gross Profit */}
          <div className="valuation-card">
            <div className="v-label">Potential Profit</div>
            <div className="v-value" style={{ color: 'var(--color-success)' }}>
              {formatCurrency(summaryMetrics.potentialProfit)}
            </div>
            <div className="v-sub">Retail minus cost valuation</div>
          </div>

          {/* Total Units */}
          <div className="valuation-card">
            <div className="v-label">Stock Units</div>
            <div className="v-value">{formatNumber(summaryMetrics.totalUnits)}</div>
            <div className="v-sub">Across {summaryMetrics.totalProducts} items</div>
          </div>

          {/* Low Stock Alert */}
          <div
            className="valuation-card"
            style={{
              borderColor: summaryMetrics.lowStockCount > 0 ? '#fed7aa' : undefined,
              background: summaryMetrics.lowStockCount > 0 ? '#fffbeb' : undefined,
            }}
          >
            <div className="v-label" style={{ color: summaryMetrics.lowStockCount > 0 ? '#c2410c' : undefined }}>
              Low Stock Alert
            </div>
            <div className="v-value" style={{ color: '#ea580c' }}>
              {summaryMetrics.lowStockCount}
            </div>
            <div className="v-sub">At or below reorder level</div>
          </div>

          {/* Out of Stock Alert */}
          <div
            className="valuation-card"
            style={{
              borderColor: summaryMetrics.outOfStockCount > 0 ? '#fecaca' : undefined,
              background: summaryMetrics.outOfStockCount > 0 ? '#fef2f2' : undefined,
            }}
          >
            <div className="v-label" style={{ color: summaryMetrics.outOfStockCount > 0 ? '#b91c1c' : undefined }}>
              Out of Stock
            </div>
            <div className="v-value" style={{ color: 'var(--color-danger)' }}>
              {summaryMetrics.outOfStockCount}
            </div>
            <div className="v-sub">Immediate zero stock items</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          <span>📦</span>
          <span>Current Stock & Valuation</span>
          <span className="tab-badge">{summaryMetrics?.totalProducts || pagination.total}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          <span>📜</span>
          <span>Stock Movement Audit Log</span>
          <span className="tab-badge">{movementsPagination.total || 'Audit'}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'lowStock' ? 'active' : ''}`}
          onClick={() => setActiveTab('lowStock')}
        >
          <span>⚠️</span>
          <span>Low Stock & Reorder Watchlist</span>
          {summaryMetrics && summaryMetrics.lowStockCount + summaryMetrics.outOfStockCount > 0 && (
            <span className="tab-badge danger">
              {summaryMetrics.lowStockCount + summaryMetrics.outOfStockCount} items
            </span>
          )}
        </button>

        {/* Global Quick Action */}
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn-primary"
            onClick={() => handleOpenAdjustForProduct(null, 'ADD')}
          >
            <span>⚡</span>
            <span>Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: CURRENT STOCK & VALUATION                            */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <>
          {/* Toolbar & Filters */}
          <div className="toolbar-card">
            <div className="filter-row">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search inventory by product, SKU, barcode, supplier..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Category Filter */}
              <select
                className="select-control"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category} ({c.count})
                  </option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <select
                className="select-control"
                value={stockStatus}
                onChange={(e) => {
                  setStockStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock (&gt; Min)</option>
                <option value="low_stock">Low Stock (≤ Min)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>

              {/* Sort By */}
              <select
                className="select-control"
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, ord] = e.target.value.split('-');
                  setSortField(field);
                  setSortOrder(ord || 'ASC');
                  setPage(1);
                }}
              >
                <option value="stock_quantity-ASC">Stock: Lowest First</option>
                <option value="stock_quantity-DESC">Stock: Highest First</option>
                <option value="cost_valuation-DESC">Cost Value: High to Low</option>
                <option value="retail_valuation-DESC">Retail Value: High to Low</option>
                <option value="name-ASC">Name (A-Z)</option>
              </select>

              {(search || category !== 'all' || stockStatus !== 'all' || sortField !== 'stock_quantity') && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setCategory('all');
                    setStockStatus('all');
                    setSortField('stock_quantity');
                    setSortOrder('ASC');
                    setPage(1);
                  }}
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table Card */}
          <div className="card">
            {loadingStock && <LoadingSpinner message="Loading stock inventory..." />}

            {errorStock && (
              <ErrorState
                message="Could not load inventory."
                hint={errorStock}
                onRetry={fetchInventoryList}
              />
            )}

            {!loadingStock && !errorStock && inventoryData.length === 0 && (
              <div style={{ padding: 32 }}>
                <EmptyState message="No inventory records match the current filters." />
              </div>
            )}

            {!loadingStock && !errorStock && inventoryData.length > 0 && (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Status</th>
                        <th>Cost Price</th>
                        <th>Cost Valuation</th>
                        <th>Retail Price</th>
                        <th>Retail Valuation</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData.map((item) => (
                        <tr key={item.id}>
                          {/* Product Info */}
                          <td>
                            <div className="product-cell">
                              <div className="product-thumb">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerText = '📦';
                                    }}
                                  />
                                ) : (
                                  '📦'
                                )}
                              </div>
                              <div>
                                <Link to={`/products/${item.id}`} className="product-title-link">
                                  {item.name}
                                </Link>
                                <div className="product-meta-sub">
                                  <span>SKU: {item.sku}</span>
                                  {item.barcode && <span className="barcode-pill">#{item.barcode}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td>
                            <span className="badge badge-blue">{item.category}</span>
                          </td>

                          {/* Stock Units & Mini Health Bar */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              <strong style={{ fontSize: 14 }}>{formatNumber(item.stock_quantity)}</strong>
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                / min {item.minimum_stock}
                              </span>
                            </div>
                            <div className="stock-level-bar-wrap">
                              <div
                                className="stock-level-bar-fill"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (item.stock_quantity / Math.max(1, item.minimum_stock * 2)) * 100
                                  )}%`,
                                  background:
                                    item.stock_quantity === 0
                                      ? 'var(--color-danger)'
                                      : item.stock_quantity <= item.minimum_stock
                                      ? 'var(--color-warning)'
                                      : 'var(--color-success)',
                                }}
                              />
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td>
                            <span className={`badge ${getStockStatusClass(item.stock_status)}`}>
                              {getStockStatusLabel(item.stock_status)}
                            </span>
                          </td>

                          {/* Cost Price */}
                          <td style={{ color: 'var(--color-text-secondary)' }}>
                            {formatCurrency(item.cost_price)}
                          </td>

                          {/* Cost Valuation */}
                          <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {formatCurrency(item.cost_valuation)}
                          </td>

                          {/* Retail Selling Price */}
                          <td style={{ color: 'var(--color-text-secondary)' }}>
                            {formatCurrency(item.selling_price)}
                          </td>

                          {/* Retail Valuation */}
                          <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            {formatCurrency(item.retail_valuation)}
                          </td>

                          {/* Actions */}
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-sm btn-adjust"
                                title="Adjust stock level"
                                onClick={() => handleOpenAdjustForProduct(item)}
                              >
                                ⚡ Adjust
                              </button>
                              <button
                                className="btn-icon"
                                title="View movement history"
                                onClick={() => handleOpenHistory(item)}
                              >
                                📜
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="pagination-wrapper">
                  <div>
                    Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} inventory items)
                  </div>
                  <div className="pagination-buttons">
                    <button
                      className="page-btn"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                    >
                      ← Previous
                    </button>
                    <button
                      className="page-btn"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: STOCK MOVEMENT AUDIT LOG                             */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'movements' && (
        <>
          <div className="toolbar-card">
            <div className="filter-row">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search movement audit log by product, SKU, reason..."
                  value={movementSearch}
                  onChange={(e) => {
                    setMovementSearch(e.target.value);
                    setMovementsPage(1);
                  }}
                />
              </div>

              {/* Movement Type Filter */}
              <select
                className="select-control"
                value={movementTypeFilter}
                onChange={(e) => {
                  setMovementTypeFilter(e.target.value);
                  setMovementsPage(1);
                }}
              >
                <option value="all">All Movement Types</option>
                <option value="Stock received">📥 Stock received</option>
                <option value="Stock sold">📤 Stock sold</option>
                <option value="Manual adjustment">⚙️ Manual adjustment</option>
                <option value="Stock returned">🔄 Stock returned</option>
              </select>

              {(movementSearch || movementTypeFilter !== 'all') && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setMovementSearch('');
                    setMovementTypeFilter('all');
                    setMovementsPage(1);
                  }}
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="card">
            {loadingMovements && <LoadingSpinner message="Loading stock movement log..." />}

            {errorMovements && (
              <ErrorState
                message="Could not load stock movements."
                hint={errorMovements}
                onRetry={fetchMovements}
              />
            )}

            {!loadingMovements && !errorMovements && movementsData.length === 0 && (
              <div style={{ padding: 32 }}>
                <EmptyState message="No stock movement records found matching your filters." />
              </div>
            )}

            {!loadingMovements && !errorMovements && movementsData.length > 0 && (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Product</th>
                        <th>Movement Type</th>
                        <th>Delta Change</th>
                        <th>Stock Shift</th>
                        <th>Reason / Notes</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movementsData.map((m) => (
                        <tr key={m.id}>
                          {/* Date */}
                          <td style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                            <div>{formatDate(m.created_at)}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              {formatRelativeTime(m.created_at)}
                            </div>
                          </td>

                          {/* Product */}
                          <td>
                            <div className="product-cell">
                              <div className="product-thumb" style={{ width: 36, height: 36 }}>
                                {m.image_url ? (
                                  <img src={m.image_url} alt={m.product_name} />
                                ) : (
                                  '📦'
                                )}
                              </div>
                              <div>
                                <Link to={`/products/${m.product_id}`} className="product-title-link">
                                  {m.product_name}
                                </Link>
                                <div className="product-meta-sub">
                                  <span>SKU: {m.sku}</span>
                                  <span>• {m.category}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Movement Type */}
                          <td>{renderMovementPill(m.movement_type)}</td>

                          {/* Delta */}
                          <td>
                            <strong
                              style={{
                                fontSize: 13.5,
                                color:
                                  m.quantity > 0
                                    ? 'var(--color-success)'
                                    : m.quantity < 0
                                    ? 'var(--color-danger)'
                                    : 'var(--color-text-muted)',
                              }}
                            >
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                            </strong>
                          </td>

                          {/* Shift */}
                          <td>
                            <span className="shift-badge">
                              <span>{m.previous_stock}</span>
                              <span className="shift-arrow">➔</span>
                              <strong>{m.new_stock}</strong>
                            </span>
                          </td>

                          {/* Reason */}
                          <td style={{ fontSize: 12.5, color: 'var(--color-text-primary)', maxWidth: 260 }}>
                            {m.reason || '—'}
                          </td>

                          {/* Quick Adjust */}
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn-sm btn-adjust"
                              onClick={() =>
                                handleOpenAdjustForProduct({
                                  id: m.product_id,
                                  name: m.product_name,
                                  sku: m.sku,
                                  stock_quantity: m.new_stock,
                                  image_url: m.image_url,
                                })
                              }
                            >
                              ⚡ Adjust
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
                    Page <strong>{movementsPagination.page}</strong> of{' '}
                    <strong>{movementsPagination.totalPages}</strong> ({movementsPagination.total} logged movements)
                  </div>
                  <div className="pagination-buttons">
                    <button
                      className="page-btn"
                      onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                      disabled={movementsPagination.page <= 1}
                    >
                      ← Previous
                    </button>
                    <button
                      className="page-btn"
                      onClick={() => setMovementsPage((p) => Math.min(movementsPagination.totalPages, p + 1))}
                      disabled={movementsPagination.page >= movementsPagination.totalPages}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 3: LOW STOCK & REORDER WATCHLIST                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'lowStock' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Reorder Priority Watchlist</h3>
              <p>Items currently at or below their safety reorder threshold</p>
            </div>
            <span className="badge status-low-stock">
              {lowStockList.length} items require replenishment
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loadingLowStock && <LoadingSpinner message="Analyzing replenishment priorities..." />}

            {errorLowStock && (
              <ErrorState
                message="Could not load replenishment list."
                hint={errorLowStock}
                onRetry={fetchLowStockWatchlist}
              />
            )}

            {!loadingLowStock && !errorLowStock && lowStockList.length === 0 && (
              <div style={{ padding: 32 }}>
                <EmptyState message="All inventory items are currently above their safety stock threshold!" />
              </div>
            )}

            {!loadingLowStock && !errorLowStock && lowStockList.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Safety Min</th>
                      <th>Units Deficit</th>
                      <th>Est. Reorder Cost</th>
                      <th>Supplier</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockList.map((item) => (
                      <tr key={item.id}>
                        {/* Product */}
                        <td>
                          <div className="product-cell">
                            <div className="product-thumb">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} />
                              ) : (
                                '📦'
                              )}
                            </div>
                            <div>
                              <Link to={`/products/${item.id}`} className="product-title-link">
                                {item.name}
                              </Link>
                              <div className="product-meta-sub">
                                <span>SKU: {item.sku}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="badge badge-blue">{item.category}</span>
                        </td>

                        {/* Current Stock */}
                        <td>
                          <strong
                            style={{
                              color: item.stock_quantity === 0 ? 'var(--color-danger)' : '#ea580c',
                            }}
                          >
                            {item.stock_quantity} units
                          </strong>
                        </td>

                        {/* Minimum Stock */}
                        <td style={{ color: 'var(--color-text-muted)' }}>{item.minimum_stock} units</td>

                        {/* Deficit */}
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: '#fee2e2',
                              color: '#b91c1c',
                              fontWeight: 700,
                            }}
                          >
                            +{Math.max(1, item.units_needed)} units needed
                          </span>
                        </td>

                        {/* Estimated Reorder Cost */}
                        <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {formatCurrency(item.reorder_estimated_cost || item.cost_price * Math.max(1, item.units_needed))}
                        </td>

                        {/* Supplier */}
                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {item.supplier || 'Direct Supplier'}
                        </td>

                        {/* Quick Restock Action */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-sm btn-reorder"
                            onClick={() =>
                              handleOpenAdjustForProduct(
                                item,
                                'ADD',
                                Math.max(1, item.units_needed),
                                `Restock delivery from ${item.supplier || 'supplier'}`
                              )
                            }
                          >
                            📥 Receive Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        product={adjustTargetProduct}
        initialAdjustmentType={adjustInitialType}
        initialQuantity={adjustInitialQty}
        initialReason={adjustInitialReason}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setAdjustTargetProduct(null);
        }}
        onSuccess={handleAdjustmentSuccess}
      />

      {/* Stock Movement History Modal */}
      <StockHistoryModal
        isOpen={isHistoryModalOpen}
        product={historyTargetProduct}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryTargetProduct(null);
        }}
      />
    </div>
  );
}
