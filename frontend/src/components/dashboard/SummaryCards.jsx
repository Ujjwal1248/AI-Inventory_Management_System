import React from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { getDashboardSummary } from '../../services/api.js';
import { formatCurrency, formatNumber } from '../../utils/formatters.js';
import { LoadingSpinner, ErrorState } from './States.jsx';

const CARDS = [
  {
    key: 'totalProducts',
    label: 'Total Products',
    icon: '📦',
    colorClass: 'card-blue',
    sub: 'in catalogue',
    format: formatNumber,
  },
  {
    key: 'totalStockUnits',
    label: 'Total Stock Units',
    icon: '🗄️',
    colorClass: 'card-green',
    sub: 'units available',
    format: formatNumber,
  },
  {
    key: 'totalInventoryValue',
    label: 'Inventory Value',
    icon: '💎',
    colorClass: 'card-purple',
    sub: 'at selling price',
    format: formatCurrency,
  },
  {
    key: 'lowStockProducts',
    label: 'Low Stock',
    icon: '⚠️',
    colorClass: 'card-orange',
    sub: 'need restocking',
    format: formatNumber,
  },
  {
    key: 'outOfStockProducts',
    label: 'Out of Stock',
    icon: '🚫',
    colorClass: 'card-red',
    sub: 'unavailable items',
    format: formatNumber,
  },
];

export default function SummaryCards() {
  const { data, loading, error, refetch } = useFetch(getDashboardSummary);

  if (loading) {
    return (
      <div className="summary-cards">
        {CARDS.map((c) => (
          <div key={c.key} className={`summary-card ${c.colorClass}`} style={{ opacity: 0.5 }}>
            <div className="summary-card-icon">{c.icon}</div>
            <div className="summary-card-body">
              <div className="label">{c.label}</div>
              <div className="value">—</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ marginBottom: 24 }}>
        <ErrorState
          message="Could not load summary data."
          hint={error}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="summary-cards">
      {CARDS.map((card) => (
        <div key={card.key} className={`summary-card ${card.colorClass}`}>
          <div className="summary-card-icon">{card.icon}</div>
          <div className="summary-card-body">
            <div className="label">{card.label}</div>
            <div className="value">{card.format(data?.[card.key] ?? 0)}</div>
            <div className="sub">{card.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
