const express = require('express');
const router = express.Router();
const { getPosProducts } = require('../controllers/salesController');

router.get('/products', getPosProducts);

module.exports = router;
