/**
 * ProtectedRoute.jsx — Redirects unauthenticated users to /login.
 * Shows a spinner while the session check is in-flight.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner" />
        <p className="loading-text">Loading…</p>
      </div>
    );
  }

  if (!user) {
    // Preserve the intended URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
