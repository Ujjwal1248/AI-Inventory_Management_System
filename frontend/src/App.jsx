import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Inventory from './pages/Inventory.jsx';
import Sales from './pages/Sales.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public Auth Routes ── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Protected Application Routes ── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index                   element={<Dashboard />} />
            <Route path="products"         element={<Products />} />
            <Route path="products/:id"     element={<ProductDetails />} />
            <Route path="inventory"        element={<Inventory />} />
            <Route path="sales"            element={<Sales />} />
            <Route path="forecasting"      element={<PlaceholderPage title="Forecasting"        icon="🔮" />} />
            <Route path="suppliers"        element={<PlaceholderPage title="Suppliers"           icon="🚚" />} />
            <Route path="purchase-orders"  element={<PlaceholderPage title="Purchase Orders"    icon="🛒" />} />
            <Route path="competitor"       element={<PlaceholderPage title="Competitor Pricing" icon="📊" />} />
            <Route path="settings"         element={<PlaceholderPage title="Settings"           icon="⚙️" />} />
          </Route>

          {/* ── Catch-all → Dashboard ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
