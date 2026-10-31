const express = require('express');
const router = express.Router();

const {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// Categories route must precede /:id to avoid matching 'categories' as an ID
router.get('/categories', getCategories);

// Main CRUD endpoints
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
