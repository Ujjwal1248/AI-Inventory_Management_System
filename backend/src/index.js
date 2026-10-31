require('dotenv').config();
const express = require('express');
const cors = require('cors');

const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const posRoutes = require('./routes/pos');
const salesRoutes = require('./routes/sales');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`➡️  ${req.method} ${req.url}`);
    next();
  });
}

// ──────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const { query } = require('./config/database');
    await query('SELECT 1');
    res.json({
      success: true,
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'degraded',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/sales', salesRoutes);

// ──────────────────────────────────────────────
// Error Handling
// ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Gemini Inventory Backend`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
