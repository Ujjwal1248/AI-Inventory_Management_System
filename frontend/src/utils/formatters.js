/**
 * formatters.js — Utility functions for formatting values in the UI.
 */

/**
 * Format a number as Indian Rupees currency.
 * e.g.  79999 → "₹79,999"
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format large numbers with commas.
 * e.g. 1234567 → "12,34,567" (Indian system)
 */
export function formatNumber(value) {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Format a date string to a human-readable relative time.
 * e.g. "2 hours ago", "3 days ago"
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs  = Math.floor(diffMs / 1000);
  const diffMins  = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays  = Math.floor(diffHours / 24);

  if (diffDays > 30)  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (diffDays > 1)   return `${diffDays} days ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffHours > 1)  return `${diffHours} hours ago`;
  if (diffMins > 1)   return `${diffMins} minutes ago`;
  return 'Just now';
}

/**
 * Format a date string to short date.
 * e.g. "29 Oct 2026"
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Return a CSS class name for a stock status string.
 */
export function getStockStatusClass(status) {
  switch (status) {
    case 'out_of_stock': return 'status-out-of-stock';
    case 'low_stock':    return 'status-low-stock';
    default:             return 'status-in-stock';
  }
}

/**
 * Return a human-readable label for a stock status string.
 */
export function getStockStatusLabel(status) {
  switch (status) {
    case 'out_of_stock': return 'Out of Stock';
    case 'low_stock':    return 'Low Stock';
    default:             return 'In Stock';
  }
}
