const Commission = require('../models/Commission');

// @desc    Get My Commissions
// @route   GET /api/commissions/my-commissions
// @access  Private
const getMyCommissions = async (req, res) => {
    try {
        const commissions = await Commission.find({ to_user_id: req.user.id })
            .populate('from_user_id', 'name email')
            .sort({ created_at: -1 });
        res.json(commissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Commissions (Admin)
// @route   GET /api/commissions
// @access  Private/Admin
const getAllCommissions = async (req, res) => {
    try {
        const commissions = await Commission.find({})
            .populate('from_user_id', 'name email')
            .populate('to_user_id', 'name email')
            .sort({ created_at: -1 });
        res.json(commissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMyCommissions,
    getAllCommissions
};
