const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

// @desc    Create new withdrawal request
// @route   POST /api/withdrawals
// @access  Private
const createWithdrawal = async (req, res) => {
    const { amount, withdraw_type, method, source, bankDetails } = req.body;

    if (!amount || !withdraw_type) {
        return res.status(400).json({ message: 'Please provide amount and withdrawal type' });
    }

    try {
        // Special validation for level_income and mining_bonus withdrawals
        if (withdraw_type === 'level_income' || withdraw_type === 'mining_bonus') {
            const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
            const now = new Date();

            // Get user's distributions
            const distributions = await MonthlyTokenDistribution.find({
                user_id: req.user._id,
                status: 'pending'
            });

            // Calculate matured balance based on type
            let availableMatured = 0;
            if (withdraw_type === 'level_income') {
                availableMatured = distributions.reduce((sum, dist) => {
                    if (dist.status === 'pending' && dist.scheduled_date <= now && dist.level > 0) {
                        return sum + dist.monthly_amount;
                    }
                    return sum;
                }, 0);
            } else { // mining_bonus (level 0 ROI)
                availableMatured = distributions.reduce((sum, dist) => {
                    if (dist.status === 'pending' && dist.scheduled_date <= now && dist.level === 0) {
                        return sum + dist.monthly_amount;
                    }
                    return sum;
                }, 0);
            }

            // Get user details
            const user = await User.findById(req.user.id);

            // Check amount against matured balance
            if (amount > availableMatured) {
                return res.status(400).json({
                    message: `Insufficient matured balance. Available: ${Math.round(availableMatured * 100) / 100}`
                });
            }

            // Mark matured distributions as paid (starting from oldest)
            let remainingToMark = amount;
            const targetLevelFilter = withdraw_type === 'level_income' ? { $gt: 0 } : 0;
            const sortedDistributions = distributions
                .filter(d => d.status === 'pending' && d.scheduled_date <= now && 
                            (withdraw_type === 'level_income' ? d.level > 0 : d.level === 0))
                .sort((a, b) => a.scheduled_date - b.scheduled_date);

            for (const dist of sortedDistributions) {
                if (remainingToMark <= 0) break;
                await MonthlyTokenDistribution.findByIdAndUpdate(dist._id, { 
                    status: 'paid', 
                    paid_date: new Date() 
                });
                remainingToMark -= dist.monthly_amount;
            }

            // Deduct from user account
            if (withdraw_type === 'level_income') {
                user.level_income = (user.level_income || 0) - amount;
                user.level_income_last_withdrawal = new Date();
                user.level_income_withdrawn_count = (user.level_income_withdrawn_count || 0) + 1;
            } else { // mining_bonus
                user.mining_bonus = (user.mining_bonus || 0) - amount;
            }
            
            await user.save();
        }

        const withdrawal = await Withdrawal.create({
            user_id: req.user.id,
            amount,
            withdraw_type,
            method,
            source,
            bankDetails,
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
