const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createProduct,
    getProducts,
    getAllProducts,
    updateProductStatus
} = require('../controllers/productController');

router.route('/')
    .post(protect, createProduct) // User buys product
    .get(protect, getProducts);   // User views their products

router.route('/all')
    .get(protect, admin, getAllProducts); // Admin views all products (if needed separate from /)

router.route('/:id')
    .put(protect, admin, updateProductStatus); // Admin approves/rejects

module.exports = router;
