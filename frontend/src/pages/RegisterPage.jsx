/**
 * RegisterPage.jsx — Account registration UI matching the app design system.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const GOOGLE_AUTH_URL = API_BASE.replace('/api', '') + '/api/auth/google';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim())  return 'Full name is required.';
    if (!form.email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email address.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const pwdStrength = (() => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8)   score++;
    if (p.length >= 12)  score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Weak',   color: '#ef4444' };
    if (score <= 3) return { label: 'Medium', color: '#f59e0b' };
    return { label: 'Strong', color: '#10b981' };
  })();

  return (
    <div className="auth-page">
      {/* Left panel — branding */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">🤖</div>
          <h1>Join Gemini Inventory</h1>
          <p>Get started for free. No credit card required.<br />Full access to all features from day one.</p>
          <div className="auth-features">
            <div className="auth-feature-item"><span>🔐</span>Secure by default</div>
            <div className="auth-feature-item"><span>⚡</span>Ready in seconds</div>
            <div className="auth-feature-item"><span>🤝</span>Google Sign-in support</div>
            <div className="auth-feature-item"><span>📱</span>Responsive design</div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2>Create an account</h2>
            <p>Start managing your inventory today</p>
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

          <div className="auth-divider"><span>or register with email</span></div>

          {error && (
            <div className="form-error-banner" role="alert">
              <span>⚠️</span>{error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" htmlFor="name">Full name <span className="req">*</span></label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" htmlFor="email">Email address <span className="req">*</span></label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label" htmlFor="password">Password <span className="req">*</span></label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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
              {pwdStrength && (
                <span style={{ fontSize: 12, color: pwdStrength.color, fontWeight: 600 }}>
                  Password strength: {pwdStrength.label}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" htmlFor="confirm">Confirm password <span className="req">*</span></label>
              <input
                id="confirm"
                name="confirm"
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner" />Creating account…</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
