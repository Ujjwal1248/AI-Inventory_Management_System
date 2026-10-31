/**
 * auth.js — Authentication routes.
 */
const router     = require('express').Router();
const passport   = require('../config/passport');
const rateLimit  = require('express-rate-limit');
const authCtrl   = require('../controllers/authController');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/authMiddleware');

// ── Rate limiters ────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              10,
  message:          { success: false, error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders:  true,
  legacyHeaders:    false,
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs:         60 * 60 * 1000, // 1 hour
  max:              5,
  message:          { success: false, error: 'Too many registration attempts. Please try again later.' },
  standardHeaders:  true,
  legacyHeaders:    false,
});

// ── Email / Password Routes ──────────────────────────────────
router.post('/register', registerLimiter, authCtrl.register);
router.post('/login',    loginLimiter,    authCtrl.login);
router.post('/logout',   requireAuth,     authCtrl.logout);

// ── Session check (public) ───────────────────────────────────
router.get('/session', authCtrl.checkSession);

// ── Protected profile route ──────────────────────────────────
router.get('/me', requireAuth, authCtrl.getMe);

// ── Google OAuth ─────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/google/failure',
    failureMessage:  true,
  }),
  authCtrl.googleCallback
);

router.get('/google/failure', authCtrl.googleAuthFailure);

module.exports = router;
