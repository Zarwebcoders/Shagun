const mongoose = require('mongoose');
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

    if (Number(amount) < 10) {
        return res.status(400).json({ message: 'Minimum withdrawal amount is 10' });
    }

    try {
        // Find user with robust ID lookup
        const userId = req.user._id || req.user.id;
        const user = await User.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(userId) ? userId : null },
                { id: userId },
                { user_id: userId }
            ].filter(q => q._id || q.id || q.user_id)
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Auto-fetch bank details if not provided
        let finalBankDetails = bankDetails;
        if (!finalBankDetails && method === 'Bank Transfer') {
            const MyAccount = require('../models/MyAccount');
            const savedAccount = await MyAccount.findOne({ 
                $or: [{ user_id: user.id }, { user_id: user.user_id }] 
            });
            if (savedAccount && savedAccount.approve === 1) {
                finalBankDetails = {
                    accountNumber: savedAccount.acc_num,
                    accountHolderName: savedAccount.acc_name,
                    ifscCode: savedAccount.back_code,
                    bankName: savedAccount.back_name,
                    branchName: savedAccount.branch
                };
            }
        }

        // 1. Calculate Available Balance (Total - Pending)
        let totalBalance = 0;
        if (withdraw_type === 'level_income') totalBalance = user.level_income || 0;
        else if (withdraw_type === 'mining_bonus') totalBalance = user.mining_bonus || 0;
        else if (withdraw_type === 'annual_bonus') totalBalance = user.anual_bonus || 0;

        const pendingWithdrawals = await Withdrawal.find({
            user_id: user.id || user.user_id || user._id.toString(),
            withdraw_type,
            approve: "2" // Pending
        });

        const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
        const availableBalance = totalBalance - totalPending;

        if (amount > availableBalance) {
            return res.status(400).json({
                message: `Insufficient balance. Available: ${Math.round(availableBalance * 100) / 100} (Pending: ${totalPending})`
            });
        }

        // 2. Additional check for level/mining (Matured balance)
        if (withdraw_type === 'level_income' || withdraw_type === 'mining_bonus') {
            const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
            const now = new Date();

            // Use raw collection to bypass Mongoose CastError with legacy string IDs
            const distCollection = mongoose.connection.db.collection('monthlytokendistributions');
            const distributions = await distCollection.find({
                $or: [
                    { user_id: user._id },
                    { user_id: user.id },
                    { user_id: user.user_id },
                    { user_id: String(user._id) }
                ],
                status: 'pending'
            }).toArray();

            let availableMatured = 0;
            if (withdraw_type === 'level_income') {
                availableMatured = distributions.reduce((sum, dist) => {
                    if (dist.scheduled_date <= now && dist.level > 0) return sum + dist.monthly_amount;
                    return sum;
                }, 0);
            } else {
                availableMatured = distributions.reduce((sum, dist) => {
                    if (dist.scheduled_date <= now && dist.level === 0) return sum + dist.monthly_amount;
                    return sum;
                }, 0);
            }

            // Round to 2 decimal places for comparison to handle floating point issues
            const availableMaturedNet = Math.round((availableMatured - totalPending) * 100) / 100;
            const requestedAmount = Math.round(Number(amount) * 100) / 100;

            if (requestedAmount > availableMaturedNet) {
                return res.status(400).json({
                    message: `Insufficient matured balance. Available: ${availableMaturedNet}`
                });
            }
        }

        // CREATE REQUEST
        const { onchain_tx_hash } = req.body;
        const isAutoApprove = !!onchain_tx_hash;

        const withdrawal = await Withdrawal.create({
            user_id: user.id || user.user_id || user._id.toString(),
            amount,
            payable_amount: Number(amount) * 0.85, // 15% deduction
            withdraw_type,
            method,
            source,
            bankDetails: finalBankDetails,
            approve: isAutoApprove ? "1" : "2", // Auto-approve if hash is present
            onchain_tx_hash: onchain_tx_hash || ""
        });

        // 3. If auto-approved (on-chain), deduct balance IMMEDIATELY
        if (isAutoApprove) {
            if (withdraw_type === 'mining_bonus') {
                user.mining_bonus = (user.mining_bonus || 0) - amount;
            } else if (withdraw_type === 'annual_bonus') {
                user.anual_bonus = (user.anual_bonus || 0) - amount;
            }
            await user.save();
            console.log(`On-chain withdrawal ${withdrawal._id} auto-deducted from ${user.email}`);
        }

        res.status(201).json(withdrawal);
    } catch (error) {
        console.error("Create Withdrawal Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's withdrawals
// @route   GET /api/withdrawals/me
// @access  Private
const getMyWithdrawals = async (req, res) => {
    try {
        const query = {
            $or: [
                { user_id: req.user.id },
                { user_id: req.user.user_id },
                { user_id: req.user._id.toString() }
            ].filter(q => q.user_id)
        };
        const withdrawals = await Withdrawal.find(query).sort({ create_at: -1 });
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

        // Find users with these custom user_ids
        const users = await User.find({
            $or: [
                { user_id: { $in: userIds } },
                { id: { $in: userIds } },
                { _id: { $in: userIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } }
            ]
        })
            .select('user_id id full_name email mobile')
            .lean();

        // Create a map for quick lookup - mapping BOTH user_id and id to the user object
        const userMap = {};
        users.forEach(user => {
            if (user.user_id) userMap[user.user_id] = user;
            if (user.id) userMap[user.id] = user;
            userMap[user._id.toString()] = user;
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

        // Only process deduction if status is transitioning from pending to approved
        if (withdrawal.approve == "2" && approve == 1) {
            const user = await User.findOne({
                $or: [
                    { id: withdrawal.user_id },
                    { user_id: withdrawal.user_id },
                    { _id: mongoose.Types.ObjectId.isValid(withdrawal.user_id) ? withdrawal.user_id : null }
                ].filter(q => q._id || q.id || q.user_id)
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found for this withdrawal' });
            }

            const amount = withdrawal.amount;
            const type = withdrawal.withdraw_type;

            // 1. Perform Deduction
            if (type === 'level_income') {
                user.level_income = (user.level_income || 0) - amount;
                user.level_income_last_withdrawal = new Date();
                user.level_income_withdrawn_count = (user.level_income_withdrawn_count || 0) + 1;
            } else if (type === 'mining_bonus') {
                user.mining_bonus = (user.mining_bonus || 0) - amount;
            } else if (type === 'annual_bonus') {
                user.anual_bonus = (user.anual_bonus || 0) - amount;
            }

            await user.save();

            console.log(`Withdrawal ${withdrawal._id} approved and deducted from ${user.email}`);
        }

        withdrawal.approve = String(approve);
        await withdrawal.save();

        res.status(200).json(withdrawal);
    } catch (error) {
        console.error("Update Withdrawal Status Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus
};
