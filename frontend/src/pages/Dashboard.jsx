import React, { useState, useEffect } from 'react';
import SummaryCards from '../components/dashboard/SummaryCards.jsx';
import MonthlySalesChart from '../components/dashboard/MonthlySalesChart.jsx';
import StockDistributionChart from '../components/dashboard/StockDistributionChart.jsx';
import TopProductsChart from '../components/dashboard/TopProductsChart.jsx';
import RecentSales from '../components/dashboard/RecentSales.jsx';
import LowStockProducts from '../components/dashboard/LowStockProducts.jsx';
import RecentlyAddedProducts from '../components/dashboard/RecentlyAddedProducts.jsx';
import InventorySummary from '../components/dashboard/InventorySummary.jsx';
import { getHealthCheck } from '../services/api.js';

export default function Dashboard() {
  const [dbStatus, setDbStatus] = useState({ checking: true, connected: false, error: null });

  useEffect(() => {
    getHealthCheck()
      .then(() => setDbStatus({ checking: false, connected: true, error: null }))
      .catch((err) => setDbStatus({ checking: false, connected: false, error: err.message }));
  }, []);

  return (
    <div>
      {/* DB Connection Status Banner */}
      {!dbStatus.checking && !dbStatus.connected && (
        <div className="db-status-banner error">
          <span className="icon">⚠️</span>
          <div>
            <strong>Database Connection Notice:</strong> Could not connect to backend or PostgreSQL database ({dbStatus.error}).
            Please ensure PostgreSQL and backend are running.
          </div>
        </div>
      )}

      {/* Top Summary Metric Cards */}
      <SummaryCards />

      {/* Charts Grid */}
      <div className="charts-grid">
        <MonthlySalesChart />
        <StockDistributionChart />
      </div>

      <div className="charts-grid-3" style={{ marginBottom: 24 }}>
        <TopProductsChart />
        <RecentSales />
        <RecentlyAddedProducts />
      </div>

      {/* Tables Grid */}
      <div className="dashboard-bottom">
        <LowStockProducts />
        <InventorySummary />
      </div>
    </div>
  );
}
