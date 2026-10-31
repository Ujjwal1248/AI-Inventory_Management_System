import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useFetch } from '../../hooks/useFetch.js';
import { getMonthlySales } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';
import { LoadingSpinner, ErrorState, EmptyState } from './States.jsx';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,.1)',
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{label}</p>
      <p style={{ color: '#4f46e5', fontSize: 13 }}>
        Sales: {formatCurrency(payload[0]?.value)}
      </p>
      <p style={{ color: '#06b6d4', fontSize: 13 }}>
        Orders: {payload[1]?.value}
      </p>
    </div>
  );
};

export default function MonthlySalesChart() {
  const { data, loading, error, refetch } = useFetch(getMonthlySales);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Monthly Sales</h3>
          <p>Last 12 months revenue overview</p>
        </div>
        <span className="badge badge-blue">📈 Trend</span>
      </div>
      <div className="card-body">
        {loading && <LoadingSpinner message="Loading sales chart..." />}
        {error   && <ErrorState message="Failed to load sales data." hint={error} onRetry={refetch} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState message="No sales data found for the last 12 months." />
        )}
        {!loading && !error && data && data.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />
              <Bar
                dataKey="totalSales"
                name="Total Sales (₹)"
                fill="#4f46e5"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
              <Bar
                dataKey="orderCount"
                name="Orders"
                fill="#06b6d4"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
