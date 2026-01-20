const SponsorIncome = require('../models/SponsorIncome');

// @desc    Get my sponsor income
// @route   GET /api/sponsor-income/my-income
// @access  Private
const getMyIncome = async (req, res) => {
    try {
        // Assuming req.user.user_id is the numerical ID based on previous context, 
        // or we need to map ObjectId to user_id if that's how the schema works.
        // For now, using req.user.user_id as per schema implication.
        const income = await SponsorIncome.find({ user_id: req.user.user_id }).sort({ created_at: -1 });
        res.status(200).json(income);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add sponsor income (Internal/Admin)
// @route   POST /api/sponsor-income
// @access  Private/Admin
const addIncome = async (req, res) => {
    const { user_id, from_user_id, amount } = req.body;

    if (!user_id || !from_user_id || !amount) {
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    try {
        const income = await SponsorIncome.create({
            user_id,
            from_user_id,
            amount
        });
        res.status(201).json(income);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMyIncome, addIncome };
