const express = require('express');
const router = express.Router();

const {
  getSummary,
  getMonthlySales,
  getStockDistribution,
  getTopProducts,
  getRecentSales,
  getLowStock,
  getRecentProducts,
  getInventorySummary,
} = require('../controllers/dashboardController');

// Dashboard summary cards
router.get('/summary', getSummary);

// Charts
router.get('/sales', getMonthlySales);
router.get('/stock-distribution', getStockDistribution);
router.get('/top-products', getTopProducts);

// Table sections
router.get('/recent-sales', getRecentSales);
router.get('/low-stock', getLowStock);
router.get('/recent-products', getRecentProducts);
router.get('/inventory-summary', getInventorySummary);

module.exports = router;
