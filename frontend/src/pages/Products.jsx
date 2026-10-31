import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, getProductCategories } from '../services/api.js';
import {
  formatCurrency,
  formatNumber,
  getStockStatusClass,
  getStockStatusLabel,
} from '../utils/formatters.js';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/dashboard/States.jsx';
import ProductFormModal from '../components/products/ProductFormModal.jsx';
import DeleteConfirmModal from '../components/products/DeleteConfirmModal.jsx';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search, filter, sort and pagination state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [stockStatus, setStockStatus] = useState(searchParams.get('stockStatus') || 'all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(parseInt(searchParams.get('page'), 10) || 1);
  const [limit] = useState(10);

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Notification Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load category list once
  useEffect(() => {
    getProductCategories()
      .then((cats) => setCategories(cats || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch products
  const fetchProductList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts({
        search,
        category: category !== 'all' ? category : '',
        stockStatus: stockStatus !== 'all' ? stockStatus : '',
        sortBy: sortField,
        sortOrder,
        page,
        limit,
      });

      setProducts(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, category, stockStatus, sortField, sortOrder, page, limit]);

  useEffect(() => {
    fetchProductList();
  }, [fetchProductList]);

  // Handle Sort Change
  const handleSortChange = (e) => {
    const val = e.target.value;
    const [field, ord] = val.split('-');
    setSortField(field);
    setSortOrder(ord || 'DESC');
    setPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setStockStatus('all');
    setSortField('created_at');
    setSortOrder('DESC');
    setPage(1);
    setSearchParams({});
  };

  // Product Saved Callback (create / edit)
  const handleProductSaved = (savedProduct, message) => {
    showToast(message, 'success');
    fetchProductList();
  };

  // Product Deleted Callback
  const handleProductDeleted = (deletedId, message) => {
    showToast(message, 'success');
    fetchProductList();
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notice ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar-top">
          <div className="toolbar-title">
            <h3>Product Catalogue</h3>
            <p>
              Showing {products.length} of {pagination.total} total inventory items
            </p>
          </div>
          <div className="toolbar-actions">
            <button
              className="btn-primary"
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
            >
              <span>➕</span>
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="filter-row">
          {/* Search Box */}
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, SKU, barcode, supplier..."
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
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt; Min)</option>
            <option value="low_stock">Low Stock (≤ Min)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Sort By */}
          <select
            className="select-control"
            value={`${sortField}-${sortOrder}`}
            onChange={handleSortChange}
          >
            <option value="created_at-DESC">Latest Added</option>
            <option value="created_at-ASC">Oldest Added</option>
            <option value="name-ASC">Name (A-Z)</option>
            <option value="name-DESC">Name (Z-A)</option>
            <option value="selling_price-ASC">Price (Low to High)</option>
            <option value="selling_price-DESC">Price (High to Low)</option>
            <option value="stock_quantity-ASC">Stock (Low to High)</option>
            <option value="stock_quantity-DESC">Stock (High to Low)</option>
          </select>

          {/* Reset Filters */}
          {(search || category !== 'all' || stockStatus !== 'all' || sortField !== 'created_at') && (
            <button className="btn-secondary" onClick={handleResetFilters} title="Reset all filters">
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        {loading && <LoadingSpinner message="Loading products..." />}

        {error && (
          <ErrorState
            message="Could not load products."
            hint={error}
            onRetry={fetchProductList}
          />
        )}

        {!loading && !error && products.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <EmptyState message="No products match your search or filter criteria." />
            {(search || category !== 'all' || stockStatus !== 'all') && (
              <button
                className="btn-secondary"
                onClick={handleResetFilters}
                style={{ marginTop: 16 }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Cost</th>
                    <th>Selling</th>
                    <th>Margin</th>
                    <th>Stock Units</th>
                    <th>Supplier</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (
                    <tr key={item.id}>
                      {/* Product details cell with thumbnail */}
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
                              {item.barcode && (
                                <span className="barcode-pill">
                                  #{item.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="badge badge-blue">{item.category}</span>
                      </td>

                      {/* Cost Price */}
                      <td style={{ color: 'var(--color-text-secondary)' }}>
                        {formatCurrency(item.cost_price)}
                      </td>

                      {/* Selling Price */}
                      <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {formatCurrency(item.selling_price)}
                      </td>

                      {/* Margin % */}
                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              item.margin_percent >= 25
                                ? 'var(--color-success)'
                                : item.margin_percent >= 10
                                ? 'var(--color-warning)'
                                : 'var(--color-danger)',
                          }}
                        >
                          {item.margin_percent !== null ? `${item.margin_percent}%` : '—'}
                        </span>
                      </td>

                      {/* Stock Level & Status Badge */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, minWidth: 28 }}>
                            {formatNumber(item.stock_quantity)}
                          </span>
                          <span className={`badge ${getStockStatusClass(item.stock_status)}`}>
                            {getStockStatusLabel(item.stock_status)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          Min: {item.minimum_stock}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td style={{ fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 140 }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                          {item.supplier || '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="table-actions">
                          {/* View Details */}
                          <Link
                            to={`/products/${item.id}`}
                            className="btn-icon view"
                            title="View product details"
                          >
                            👁️
                          </Link>

                          {/* Edit */}
                          <button
                            className="btn-icon"
                            title="Edit product"
                            onClick={() => {
                              setEditingProduct(item);
                              setIsFormOpen(true);
                            }}
                          >
                            ✏️
                          </button>

                          {/* Delete */}
                          <button
                            className="btn-icon delete"
                            title="Delete product"
                            onClick={() => setDeletingProduct(item)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-wrapper">
              <div>
                Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} items total)
              </div>
              <div className="pagination-buttons">
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                >
                  ← Previous
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show current page, edges, and nearby pages
                    return (
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - pagination.page) <= 1
                    );
                  })
                  .map((p, idx, arr) => {
                    const prevVal = arr[idx - 1];
                    const hasGap = prevVal && p - prevVal > 1;
                    return (
                      <React.Fragment key={p}>
                        {hasGap && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                        <button
                          className={`page-btn ${p === pagination.page ? 'active' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

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

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        product={editingProduct}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSaved={handleProductSaved}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingProduct)}
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onDeleted={handleProductDeleted}
      />
    </div>
  );
}
