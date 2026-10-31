/**
 * api.js — Centralized API service for all backend calls.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic fetch wrapper with comprehensive error handling.
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  let resJson;
  try {
    resJson = await response.json();
  } catch (err) {
    throw new Error(`Server returned non-JSON response (${response.status})`);
  }

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || `Request failed with status ${response.status}`);
  }

  return resJson;
}

// ─── Dashboard APIs ────────────────────────────────────────────

export const getDashboardSummary     = () => apiRequest('/dashboard/summary').then((r) => r.data);
export const getMonthlySales         = () => apiRequest('/dashboard/sales').then((r) => r.data);
export const getStockDistribution    = () => apiRequest('/dashboard/stock-distribution').then((r) => r.data);
export const getTopProducts          = () => apiRequest('/dashboard/top-products').then((r) => r.data);
export const getRecentSales          = () => apiRequest('/dashboard/recent-sales').then((r) => r.data);
export const getLowStock             = () => apiRequest('/dashboard/low-stock').then((r) => r.data);
export const getRecentProducts       = () => apiRequest('/dashboard/recent-products').then((r) => r.data);
export const getInventorySummary     = () => apiRequest('/dashboard/inventory-summary').then((r) => r.data);
export const getHealthCheck          = () => apiRequest('/health');

// ─── Products APIs (Phase 2) ───────────────────────────────────

/**
 * GET /api/products
 * @param {Object} params - { search, category, stockStatus, sortBy, sortOrder, page, limit }
 */
export const getProducts = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString();
  return apiRequest(`/products${queryString ? `?${queryString}` : ''}`);
};

/**
 * GET /api/products/categories
 */
export const getProductCategories = () =>
  apiRequest('/products/categories').then((r) => r.data);

/**
 * GET /api/products/:id
 */
export const getProductById = (id) =>
  apiRequest(`/products/${id}`).then((r) => r.data);

/**
 * POST /api/products
 */
export const createProduct = (productData) =>
  apiRequest('/products', {
    method: 'POST',
    body: productData,
  });

/**
 * PUT /api/products/:id
 */
export const updateProduct = (id, productData) =>
  apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: productData,
  });

/**
 * DELETE /api/products/:id
 */
export const deleteProduct = (id) =>
  apiRequest(`/products/${id}`, {
    method: 'DELETE',
  });

// ─── Inventory APIs (Phase 3) ──────────────────────────────────

/**
 * GET /api/inventory
 * @param {Object} params - { search, category, stockStatus, sortBy, sortOrder, page, limit }
 */
export const getInventory = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString();
  return apiRequest(`/inventory${queryString ? `?${queryString}` : ''}`);
};

/**
 * GET /api/inventory/:productId
 */
export const getProductInventory = (productId) =>
  apiRequest(`/inventory/${productId}`).then((r) => r.data);

/**
 * POST /api/inventory/adjust
 * @param {Object} data - { productId, adjustmentType, quantity, movementType, reason }
 */
export const adjustStock = (data) =>
  apiRequest('/inventory/adjust', {
    method: 'POST',
    body: data,
  });

/**
 * GET /api/inventory/movements
 * @param {Object} params - { productId, movementType, search, page, limit }
 */
export const getStockMovements = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString();
  return apiRequest(`/inventory/movements${queryString ? `?${queryString}` : ''}`);
};

/**
 * GET /api/inventory/low-stock
 */
export const getLowStockInventory = () =>
  apiRequest('/inventory/low-stock').then((r) => r.data);

// ─── POS & Sales APIs (Phase 4) ────────────────────────────────

/**
 * GET /api/pos/products
 * @param {Object} params - { search, barcode, category, inStockOnly }
 */
export const getPosProducts = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString();
  return apiRequest(`/pos/products${queryString ? `?${queryString}` : ''}`).then((r) => r.data);
};

/**
 * POST /api/sales
 * @param {Object} saleData - { items: [{ productId, quantity }], paymentMethod, customerName }
 */
export const createSale = (saleData) =>
  apiRequest('/sales', {
    method: 'POST',
    body: saleData,
  });

/**
 * GET /api/sales
 * @param {Object} params - { search, paymentMethod, startDate, endDate, page, limit, sortBy, sortOrder }
 */
export const getSales = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString();
  return apiRequest(`/sales${queryString ? `?${queryString}` : ''}`);
};

/**
 * GET /api/sales/:id
 */
export const getSaleById = (id) =>
  apiRequest(`/sales/${id}`).then((r) => r.data);
