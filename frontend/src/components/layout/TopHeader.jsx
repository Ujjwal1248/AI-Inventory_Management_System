import React from 'react';
import { useLocation } from 'react-router-dom';
import UserMenu from '../auth/UserMenu.jsx';

const pageTitles = {
  '/':                { title: 'Dashboard',          subtitle: 'Overview of your inventory & sales' },
  '/products':        { title: 'Products',           subtitle: 'Manage your product catalogue' },
  '/inventory':       { title: 'Inventory',          subtitle: 'Track stock levels and movements' },
  '/sales':           { title: 'Sales',              subtitle: 'View and manage sales transactions' },
  '/forecasting':     { title: 'Forecasting',        subtitle: 'AI-powered demand predictions' },
  '/suppliers':       { title: 'Suppliers',          subtitle: 'Manage supplier relationships' },
  '/purchase-orders': { title: 'Purchase Orders',    subtitle: 'Track inbound orders' },
  '/competitor':      { title: 'Competitor Pricing', subtitle: 'Monitor competitor prices' },
  '/settings':        { title: 'Settings',           subtitle: 'Configure your system preferences' },
};

export default function TopHeader() {
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: 'Gemini Inventory', subtitle: '' };

  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });

  return (
    <header className="top-header">
      <div className="top-header-left">
        <h2>{page.title}</h2>
        <p>{page.subtitle}</p>
      </div>
      <div className="top-header-right">
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{now}</span>
        <span className="header-badge">🤖 AI Powered</span>
        <UserMenu />
      </div>
    </header>
  );
}
