const MiningBonus = require('../models/MiningBonus');

// @desc    Get My Mining Bonuses
// @route   GET /api/mining-bonus
// @access  Private
const getMyMiningBonuses = async (req, res) => {
    try {
        const bonuses = await MiningBonus.find({ user_id: req.user.id }).sort({ created_at: -1 });
        res.json(bonuses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Mining Bonuses (Admin)
// @route   GET /api/mining-bonus/all
// @access  Private/Admin
const getAllMiningBonuses = async (req, res) => {
    try {
        const bonuses = await MiningBonus.find({}).populate('user_id', 'name email').sort({ created_at: -1 });
        res.json(bonuses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Mining Bonus (Admin/Manual)
// @route   POST /api/mining-bonus
// @access  Private/Admin
const createMiningBonus = async (req, res) => {
    const { user_id, amount } = req.body;
    try {
        const bonus = await MiningBonus.create({
            user_id,
            amount: Number(amount),
            created_at: new Date()
        });
        res.status(201).json(bonus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMyMiningBonuses,
    getAllMiningBonuses,
    createMiningBonus
};
