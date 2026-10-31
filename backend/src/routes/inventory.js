const express = require('express');
const router = express.Router();

const {
  getInventory,
  getProductInventory,
  adjustStock,
  getStockMovements,
  getLowStockInventory,
} = require('../controllers/inventoryController');

// Specialized routes must precede /:productId
router.get('/movements', getStockMovements);
router.get('/low-stock', getLowStockInventory);
router.post('/adjust', adjustStock);

// General inventory list & individual product inventory
router.get('/', getInventory);
router.get('/:productId', getProductInventory);

module.exports = router;
