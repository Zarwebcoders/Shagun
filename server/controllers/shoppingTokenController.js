const ShoppingToken = require('../models/ShoppingToken');

// @desc    Get my shopping tokens
// @route   GET /api/shopping-token/my-tokens
// @access  Private
const getMyTokens = async (req, res) => {
    try {
        // Assuming req.user.user_id is the numerical ID
        const tokens = await ShoppingToken.find({ user_id: req.user.user_id }).sort({ created_at: -1 });
        res.status(200).json(tokens);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add shopping token (Internal/Admin)
// @route   POST /api/shopping-token
// @access  Private/Admin
const addToken = async (req, res) => {
    const { user_id, source, amount } = req.body;

    if (!user_id || !source || !amount) {
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    try {
        const token = await ShoppingToken.create({
            user_id,
            source,
            amount
        });
        res.status(201).json(token);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMyTokens, addToken };
