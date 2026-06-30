const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getMyTokens, addToken } = require('../controllers/shoppingTokenController');

router.get('/my-tokens', protect, getMyTokens);
router.post('/', protect, admin, addToken);

module.exports = router;
