/**
 * authMiddleware.js — Authentication & authorization helpers.
 */

/**
 * requireAuth — Protects routes. Returns 401 if not authenticated.
 */
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({
    success: false,
    error:   'Authentication required. Please log in.',
  });
};

/**
 * requireAdmin — Additional role check (for future admin-only endpoints).
 */
const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.role === 'admin') return next();
  return res.status(403).json({
    success: false,
    error:   'Access denied. Admin role required.',
  });
};

/**
 * redirectIfAuthenticated — Used on login/register pages; redirects
 * already-logged-in API callers back.
 */
const redirectIfAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({ success: true, message: 'Already authenticated.', user: safeUser(req.user) });
  }
  next();
};

/**
 * safeUser — Strips sensitive fields before sending to the client.
 */
const safeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
};

module.exports = { requireAuth, requireAdmin, redirectIfAuthenticated, safeUser };
