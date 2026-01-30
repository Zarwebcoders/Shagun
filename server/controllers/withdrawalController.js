const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

// @desc    Create new withdrawal request
// @route   POST /api/withdrawals
// @access  Private
const createWithdrawal = async (req, res) => {
    const { amount, withdraw_type } = req.body;

    if (!amount || !withdraw_type) {
        return res.status(400).json({ message: 'Please provide amount and withdrawal type' });
    }

    try {
        const withdrawal = await Withdrawal.create({
            user_id: req.user.id,
            amount,
            withdraw_type,
            approve: 2 // Default to pending
        });

        res.status(201).json(withdrawal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's withdrawals
// @route   GET /api/withdrawals/me
// @access  Private
const getMyWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ user_id: req.user.id }).sort({ create_at: -1 });
        res.status(200).json(withdrawals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all withdrawals (Admin)
// @route   GET /api/withdrawals/all
// @access  Private/Admin
const getAllWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({}).sort({ create_at: -1 }).lean();

        // Get unique user_ids from withdrawals
        const userIds = [...new Set(withdrawals.map(w => w.user_id))];

        // Find users with these custom user_ids (search in both user_id and id fields)
        const users = await User.find({
            $or: [
                { user_id: { $in: userIds } },
                { id: { $in: userIds } }
            ]
        })
            .select('user_id id full_name email mobile')
            .lean();

        // Create a map for quick lookup - mapping BOTH user_id and id to the user object
        const userMap = {};
        users.forEach(user => {
            if (user.user_id) userMap[user.user_id] = user;
            if (user.id) userMap[user.id] = user;
        });

        // Attach user details to withdrawals
        const populatedWithdrawals = withdrawals.map(w => ({
            ...w,
            user_id: userMap[w.user_id] || { full_name: 'Unknown User', email: 'N/A' }
        }));

        res.status(200).json(populatedWithdrawals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update withdrawal status (Admin)
// @route   PUT /api/withdrawals/:id
// @access  Private/Admin
const updateWithdrawalStatus = async (req, res) => {
    const { approve } = req.body; // 1: Approve, 0: Reject

    try {
        const withdrawal = await Withdrawal.findById(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({ message: 'Withdrawal request not found' });
        }

        withdrawal.approve = approve;
        await withdrawal.save();

        res.status(200).json(withdrawal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus
};
