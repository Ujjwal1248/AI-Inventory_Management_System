/**
 * LoginPage.jsx — Professional login UI matching the app design system.
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const GOOGLE_AUTH_URL = API_BASE.replace('/api', '') + '/api/auth/google';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Pre-fill error from Google OAuth failure redirect
  const urlError = new URLSearchParams(location.search).get('error');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel — branding */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">🤖</div>
          <h1>Gemini Inventory</h1>
          <p>AI-powered retail management system.<br />Smart insights, real-time inventory, seamless POS.</p>
          <div className="auth-features">
            <div className="auth-feature-item"><span>📦</span>Real-time Inventory Tracking</div>
            <div className="auth-feature-item"><span>💰</span>Integrated Point of Sale</div>
            <div className="auth-feature-item"><span>📊</span>AI-powered Analytics</div>
            <div className="auth-feature-item"><span>🔮</span>Demand Forecasting</div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {/* Google OAuth */}
          <a href={GOOGLE_AUTH_URL} className="btn-google">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="auth-divider"><span>or sign in with email</span></div>

          {/* Error banners */}
          {(error || urlError) && (
            <div className="form-error-banner" role="alert">
              <span>⚠️</span>
              {error || (urlError === 'google_auth_failed' ? 'Google sign-in failed. Please try again.' : urlError)}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password">Password</label>
              </div>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPwd((p) => !p)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner" />Signing in…</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="auth-link">Create one for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
