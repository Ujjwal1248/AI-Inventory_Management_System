import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useFetch } from '../../hooks/useFetch.js';
import { getStockDistribution } from '../../services/api.js';
import { formatNumber } from '../../utils/formatters.js';
import { LoadingSpinner, ErrorState, EmptyState } from './States.jsx';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,.1)',
    }}>
      <p style={{ fontWeight: 700, fontSize: 13 }}>{d.category}</p>
      <p style={{ color: '#64748b', fontSize: 12 }}>Stock: {formatNumber(d.total_stock)} units</p>
      <p style={{ color: '#64748b', fontSize: 12 }}>Products: {d.product_count}</p>
    </div>
  );
};

export default function StockDistributionChart() {
  const { data, loading, error, refetch } = useFetch(getStockDistribution);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Stock Distribution</h3>
          <p>By category</p>
        </div>
        <span className="badge badge-purple">🥧 Breakdown</span>
      </div>
      <div className="card-body">
        {loading && <LoadingSpinner message="Loading chart..." />}
        {error   && <ErrorState message="Failed to load stock data." hint={error} onRetry={refetch} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState message="No stock data available." />
        )}
        {!loading && !error && data && data.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total_stock"
                nameKey="category"
                cx="50%"
                cy="45%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={3}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(v) => <span style={{ color: '#64748b' }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
