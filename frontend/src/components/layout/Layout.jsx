import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopHeader from './TopHeader.jsx';

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
