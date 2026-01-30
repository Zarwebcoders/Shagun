const LevelIncome = require('../models/LevelIncome');

// @desc    Get My Level Incomes
// @route   GET /api/level-income
// @access  Private
// @desc    Get My Level Incomes
// @route   GET /api/level-income
// @access  Private
const getMyLevelIncomes = async (req, res) => {
    try {
        // 1. Get current user's numeric ID
        const user = await require('../models/User').findById(req.user._id).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const queryId = user.id || user.user_id; // "827"

        // 2. Find Level Incomes for this user
        const incomes = await LevelIncome.find({ user_id: queryId })
            .sort({ created_at: -1 })
            .lean();

        // 3. Collect from_user_ids to fetch names
        const fromIds = [...new Set(incomes.map(inc => inc.from_user_id).filter(id => id))];

        // 4. Fetch details for these users (matching 'id' field)
        const fromUsers = await require('../models/User').find({ id: { $in: fromIds } })
            .select('id full_name email user_id')
            .lean();

        // 5. Create Map
        const userMap = {};
        fromUsers.forEach(u => { userMap[u.id] = u; });

        // 6. Attach details
        const incomesWithDetails = incomes.map(inc => {
            const fromUser = userMap[inc.from_user_id];
            return {
                ...inc,
                from_user_id: fromUser ? {
                    name: fromUser.full_name,
                    email: fromUser.email,
                    _id: fromUser._id
                } : { name: 'Unknown', email: '' }
            };
        });

        res.json(incomesWithDetails);
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
