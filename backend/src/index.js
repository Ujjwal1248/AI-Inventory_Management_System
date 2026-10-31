require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const session        = require('express-session');
const PgSession      = require('connect-pg-simple')(session);
const cookieParser   = require('cookie-parser');
const passport       = require('./config/passport');
const { pool }       = require('./config/database');

const dashboardRoutes = require('./routes/dashboard');
const productRoutes   = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const posRoutes       = require('./routes/pos');
const salesRoutes     = require('./routes/sales');
const authRoutes      = require('./routes/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { requireAuth }            = require('./middleware/authMiddleware');

const app  = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────────────
// Trust proxy (required behind Nginx / Render / Railway)
// ──────────────────────────────────────────────
app.set('trust proxy', 1);

// ──────────────────────────────────────────────
// CORS — must come BEFORE session middleware
// ──────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,          // Required for cookies
}));

// ──────────────────────────────────────────────
// Body parsers & Cookie parser
// ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'gemini-inventory-cookie-secret'));

// ──────────────────────────────────────────────
// Session (stored in PostgreSQL)
// ──────────────────────────────────────────────
const SESSION_SECRET = process.env.SESSION_SECRET || 'gemini-inventory-session-secret-change-in-production';

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: false,   // table is created by auth-schema.sql
    }),
    secret:            SESSION_SECRET,
    name:              'gis.sid',          // custom cookie name (not the default)
    resave:            false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 days
    },
  })
);

// ──────────────────────────────────────────────
// Passport
// ──────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ──────────────────────────────────────────────
// Request logger (development only)
// ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    const user = req.user ? `[${req.user.email}]` : '[anon]';
    console.log(`➡️  ${req.method} ${req.url} ${user}`);
    next();
  });
}

// ──────────────────────────────────────────────
// Health Check (public)
// ──────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const { query } = require('./config/database');
    await query('SELECT 1');
    res.json({
      success:   true,
      status:    'ok',
      database:  'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success:   false,
      status:    'degraded',
      database:  'disconnected',
      error:     err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ──────────────────────────────────────────────
// Auth Routes (public — no requireAuth)
// ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ──────────────────────────────────────────────
// Protected API Routes
// ──────────────────────────────────────────────
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/products',  requireAuth, productRoutes);
app.use('/api/inventory', requireAuth, inventoryRoutes);
app.use('/api/pos',       requireAuth, posRoutes);
app.use('/api/sales',     requireAuth, salesRoutes);

// ──────────────────────────────────────────────
// Error Handling
// ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🚀 Gemini Inventory Backend');
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Auth endpoints: http://localhost:${PORT}/api/auth/session\n`);
});

module.exports = app;
