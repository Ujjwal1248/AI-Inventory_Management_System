import React, { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../../services/api.js';

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Groceries',
  'Home & Kitchen',
  'Sports & Fitness',
  'Beauty & Personal Care',
  'Toys & Games',
  'Books & Stationery',
];

export default function ProductFormModal({ product, isOpen, onClose, onSaved }) {
  const isEditing = Boolean(product && product.id);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Electronics',
    description: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '0',
    minimum_stock: '10',
    supplier: '',
    image_url: '',
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product && isEditing) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category: product.category || 'Electronics',
        description: product.description || '',
        cost_price: product.cost_price ?? '',
        selling_price: product.selling_price ?? '',
        stock_quantity: product.stock_quantity ?? 0,
        minimum_stock: product.minimum_stock ?? 10,
        supplier: product.supplier || '',
        image_url: product.image_url || '',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category: 'Electronics',
        description: '',
        cost_price: '',
        selling_price: '',
        stock_quantity: '0',
        minimum_stock: '10',
        supplier: '',
        image_url: '',
      });
    }
    setError(null);
  }, [product, isEditing, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateMargin = () => {
    const cost = parseFloat(formData.cost_price);
    const sell = parseFloat(formData.selling_price);
    if (!isNaN(cost) && !isNaN(sell) && sell > 0) {
      const margin = ((sell - cost) / sell) * 100;
      return margin.toFixed(1);
    }
    return null;
  };

  const margin = calculateMargin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Please provide a product name.');
      return;
    }
    if (!formData.sku.trim()) {
      setError('Please provide a unique SKU.');
      return;
    }
    if (!formData.category.trim()) {
      setError('Please select a category.');
      return;
    }
    if (formData.cost_price === '' || isNaN(formData.cost_price) || Number(formData.cost_price) < 0) {
      setError('Please enter a valid non-negative cost price.');
      return;
    }
    if (formData.selling_price === '' || isNaN(formData.selling_price) || Number(formData.selling_price) < 0) {
      setError('Please enter a valid non-negative selling price.');
      return;
    }
    if (isNaN(formData.stock_quantity) || Number(formData.stock_quantity) < 0) {
      setError('Stock quantity must be a non-negative number.');
      return;
    }
    if (isNaN(formData.minimum_stock) || Number(formData.minimum_stock) < 0) {
      setError('Minimum stock must be a non-negative number.');
      return;
    }

    setSubmitting(true);
    try {
      let saved;
      if (isEditing) {
        saved = await updateProduct(product.id, formData);
      } else {
        saved = await createProduct(formData);
      }
      onSaved(saved.data, isEditing ? 'Product updated successfully!' : 'Product added successfully!');
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred while saving the product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3>{isEditing ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="form-error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-grid">
            {/* Name */}
            <div className="form-group form-full">
              <label className="form-label">
                Product Name <span className="req">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Apple iPhone 15 128GB"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* SKU */}
            <div className="form-group">
              <label className="form-label">
                SKU (Stock Keeping Unit) <span className="req">*</span>
              </label>
              <input
                type="text"
                name="sku"
                className="form-input"
                placeholder="e.g. EL-009"
                value={formData.sku}
                onChange={handleChange}
                required
              />
              <span className="form-hint">Must be unique identifier</span>
            </div>

            {/* Barcode */}
            <div className="form-group">
              <label className="form-label">Barcode / UPC / EAN</label>
              <input
                type="text"
                name="barcode"
                className="form-input"
                placeholder="e.g. 890100100009"
                value={formData.barcode}
                onChange={handleChange}
              />
              <span className="form-hint">Unique 12-13 digit code (optional)</span>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">
                Category <span className="req">*</span>
              </label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier */}
            <div className="form-group">
              <label className="form-label">Supplier / Distributor</label>
              <input
                type="text"
                name="supplier"
                className="form-input"
                placeholder="e.g. Tata Consumer Products"
                value={formData.supplier}
                onChange={handleChange}
              />
            </div>

            {/* Cost Price */}
            <div className="form-group">
              <label className="form-label">
                Cost Price (₹) <span className="req">*</span>
              </label>
              <input
                type="number"
                name="cost_price"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={formData.cost_price}
                onChange={handleChange}
                required
              />
            </div>

            {/* Selling Price */}
            <div className="form-group">
              <label className="form-label">
                Selling Price (₹) <span className="req">*</span>
              </label>
              <input
                type="number"
                name="selling_price"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={formData.selling_price}
                onChange={handleChange}
                required
              />
              {margin !== null && (
                <span className="form-hint" style={{ color: Number(margin) >= 20 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  Estimated profit margin: {margin}%
                </span>
              )}
            </div>

            {/* Stock Quantity */}
            <div className="form-group">
              <label className="form-label">
                Current Stock Units <span className="req">*</span>
              </label>
              <input
                type="number"
                name="stock_quantity"
                min="0"
                className="form-input"
                placeholder="0"
                value={formData.stock_quantity}
                onChange={handleChange}
                required
              />
            </div>

            {/* Minimum Stock Alert Threshold */}
            <div className="form-group">
              <label className="form-label">
                Minimum Stock Alert Level <span className="req">*</span>
              </label>
              <input
                type="number"
                name="minimum_stock"
                min="0"
                className="form-input"
                placeholder="10"
                value={formData.minimum_stock}
                onChange={handleChange}
                required
              />
              <span className="form-hint">Triggers low-stock warnings</span>
            </div>

            {/* Image URL */}
            <div className="form-group form-full">
              <label className="form-label">Product Image URL</label>
              <input
                type="url"
                name="image_url"
                className="form-input"
                placeholder="https://images.unsplash.com/photo-..."
                value={formData.image_url}
                onChange={handleChange}
              />
              <span className="form-hint">Direct link to product photo or image</span>
            </div>

            {/* Description */}
            <div className="form-group form-full">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-textarea"
                placeholder="Detailed retail item description, specifications, or notes..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Modal Footer */}
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
              disabled={submitting}
            >
              {submitting ? 'Saving Product...' : isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
