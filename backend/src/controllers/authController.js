/**
 * authController.js — Registration, Login, Logout, Profile, Google OAuth handlers.
 */
const bcrypt   = require('bcryptjs');
const passport = require('../config/passport');
const { query } = require('../config/database');
const { safeUser } = require('../middleware/authMiddleware');

// ── POST /api/auth/register ──────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    // Hash password
    const SALT_ROUNDS = 12;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'user') RETURNING *`,
      [name.trim(), normalizedEmail, passwordHash]
    );
    const user = result.rows[0];

    // Auto-login after registration
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        user:    safeUser(user),
      });
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ─────────────────────────────────────
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ success: false, error: info?.message || 'Login failed.' });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.json({
        success: true,
        message: 'Login successful.',
        user:    safeUser(user),
      });
    });
  })(req, res, next);
};

// ── POST /api/auth/logout ────────────────────────────────────
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error('Session destroy error:', destroyErr);
      }
      res.clearCookie('gis.sid', { path: '/' });
      return res.json({ success: true, message: 'Logged out successfully.' });
    });
  });
};

// ── GET /api/auth/me ─────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // Re-fetch from DB to get latest info
    const result = await query(
      'SELECT id, name, email, avatar_url, role, google_id, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch profile.' });
  }
};

// ── GET /api/auth/session ────────────────────────────────────
// Light ping used by the frontend to check if session is alive
const checkSession = (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ success: true, authenticated: true, user: safeUser(req.user) });
  }
  return res.json({ success: true, authenticated: false });
};

// ── Google OAuth callbacks ───────────────────────────────────
const googleCallback = (req, res) => {
  // Redirect after successful Google auth
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${FRONTEND_URL}/`);
};

const googleAuthFailure = (req, res) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
};

module.exports = { register, login, logout, getMe, checkSession, googleCallback, googleAuthFailure };
