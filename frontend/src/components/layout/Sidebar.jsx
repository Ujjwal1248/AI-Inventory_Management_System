import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard',        icon: '🏠', path: '/',               section: 'Main' },
  { label: 'Products',         icon: '📦', path: '/products',       section: 'Main' },
  { label: 'Inventory',        icon: '🗄️',  path: '/inventory',      section: 'Main' },
  { label: 'Sales',            icon: '💰', path: '/sales',          section: 'Main' },
  { label: 'Forecasting',      icon: '🔮', path: '/forecasting',    section: 'Analytics' },
  { label: 'Suppliers',        icon: '🚚', path: '/suppliers',      section: 'Operations' },
  { label: 'Purchase Orders',  icon: '🛒', path: '/purchase-orders',section: 'Operations' },
  { label: 'Competitor Pricing',icon: '📊',path: '/competitor',     section: 'Analytics' },
  { label: 'Settings',         icon: '⚙️', path: '/settings',       section: 'System' },
];

// Group nav items by section
const sections = navItems.reduce((acc, item) => {
  if (!acc[item.section]) acc[item.section] = [];
  acc[item.section].push(item);
  return acc;
}, {});

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo / Brand */}
      <div className="sidebar-header">
        <div className="sidebar-logo">🤖</div>
        <div className="sidebar-brand">
          <h1>Gemini Inventory</h1>
          <p>AI Retail Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Phase 1 — v1.0.0</p>
      </div>
    </aside>
  );
}
