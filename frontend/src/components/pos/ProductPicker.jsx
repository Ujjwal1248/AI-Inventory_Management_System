import React, { useState, useEffect, useRef } from 'react';
import { getPosProducts } from '../../services/api.js';
import { formatCurrency, formatNumber, getStockStatusClass, getStockStatusLabel } from '../../utils/formatters.js';
import { LoadingSpinner, EmptyState } from '../dashboard/States.jsx';

export default function ProductPicker({
  cartItems,
  onAddToCart,
  categories = [],
  onScanBarcode,
}) {
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const barcodeInputRef = useRef(null);

  // Load products based on filters
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getPosProducts({
      search,
      category: selectedCategory !== 'all' ? selectedCategory : '',
      inStockOnly,
    })
      .then((data) => {
        if (isMounted) {
          setProducts(data || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load POS products');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [search, selectedCategory, inStockOnly]);

  // Handle direct barcode scanner enter
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim();
    setBarcodeInput('');

    // First check local products list
    const found = products.find(
      (p) => (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) || p.sku.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      onAddToCart(found);
    } else {
      // Query backend for exact barcode
      getPosProducts({ barcode: code })
        .then((items) => {
          if (items && items.length > 0) {
            onAddToCart(items[0]);
          } else {
            alert(`No product found with barcode or SKU: "${code}"`);
          }
        })
        .catch((err) => console.error(err));
    }
  };

  // Helper to get current quantity in cart for a product
  const getCartQuantity = (productId) => {
    const item = cartItems.find((line) => line.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="pos-catalog">
      {/* Search & Barcode Scan Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Barcode Scanner Direct Input */}
        <form onSubmit={handleBarcodeSubmit} className="barcode-input-bar">
          <span style={{ fontSize: 18 }}>📟</span>
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan barcode or type exact SKU / Barcode and press Enter..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
          />
          <button type="submit" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
            Scan Item
          </button>
        </form>

        {/* Search & Filters Row */}
        <div className="filter-row" style={{ marginTop: 2 }}>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search catalogue by name, SKU, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category} ({c.count})
              </option>
            ))}
          </select>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading && <LoadingSpinner message="Loading products for terminal..." />}

      {error && (
        <div className="card" style={{ padding: 20 }}>
          <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>⚠️ {error}</p>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="card" style={{ padding: 32 }}>
          <EmptyState message="No products match your search or filter." />
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="pos-product-grid">
          {products.map((product) => {
            const inCartQty = getCartQuantity(product.id);
            const isOutOfStock = product.stock_quantity === 0;
            const remainingStock = product.stock_quantity - inCartQty;

            return (
              <div
                key={product.id}
                className={`pos-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                onClick={() => {
                  if (!isOutOfStock) onAddToCart(product);
                }}
                title={
                  isOutOfStock
                    ? 'Out of stock'
                    : `Click to add to cart (${remainingStock} units available)`
                }
              >
                {/* In-cart badge */}
                {inCartQty > 0 && (
                  <span className="pos-in-cart-pill">
                    {inCartQty} in cart
                  </span>
                )}

                {/* Thumbnail */}
                <div className="pos-card-img">
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

                {/* Details */}
                <div className="pos-card-title">{product.name}</div>

                <div className="pos-card-meta">
                  <span>{product.sku}</span>
                  <span className={`badge ${getStockStatusClass(product.stock_status)}`}>
                    {product.stock_quantity} in stock
                  </span>
                </div>

                {/* Footer with Price */}
                <div className="pos-card-footer">
                  <span className="pos-card-price">{formatCurrency(product.selling_price)}</span>
                  <button
                    type="button"
                    className="btn-sm btn-adjust"
                    style={{ padding: '4px 10px' }}
                    disabled={isOutOfStock}
                  >
                    {isOutOfStock ? 'Sold Out' : '+ Add'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
