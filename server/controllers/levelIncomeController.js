const LevelIncome = require('../models/LevelIncome');

// @desc    Get My Level Incomes
// @route   GET /api/level-income
// @access  Private
const getMyLevelIncomes = async (req, res) => {
    try {
        const incomes = await LevelIncome.find({ user_id: req.user.id })
            .populate('from_user_id', 'name email')
            .sort({ created_at: -1 });
        res.json(incomes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Level Incomes (Admin)
// @route   GET /api/level-income/all
// @access  Private/Admin
const getAllLevelIncomes = async (req, res) => {
    try {
        const incomes = await LevelIncome.find({})
            .populate('user_id', 'name email')
            .populate('from_user_id', 'name email')
            .sort({ created_at: -1 });
        res.json(incomes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMyLevelIncomes,
    getAllLevelIncomes
};
