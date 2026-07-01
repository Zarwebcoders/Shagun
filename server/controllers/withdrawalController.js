const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const TokenRate = require('../models/TokenRate');

// In-memory TTL cache for the admin withdrawal list
// Key: serialised query params  Value: { data, expiry }
const withdrawalsCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function buildCacheKey(query) {
    return JSON.stringify(query);
}

function invalidateWithdrawalsCache() {
    withdrawalsCache.clear();
}

// @desc    Create new withdrawal request
// @route   POST /api/withdrawals
// @access  Private
const createWithdrawal = async (req, res) => {
    const { amount, withdraw_type, method, source, bankDetails, pin, remark } = req.body;

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

        // Verify withdrawal PIN
        if (!pin) {
            return res.status(400).json({ message: 'Please provide your 6-digit withdrawal PIN' });
        }

        const userWithPin = await User.findById(user._id).select('+withdrawal_pin +withdrawal_pin_set');
        if (!userWithPin.withdrawal_pin_set || !userWithPin.withdrawal_pin) {
            return res.status(400).json({ message: 'No withdrawal PIN set. Please set a PIN first.', pin_not_set: true });
        }

        const isPinMatch = await bcrypt.compare(pin, userWithPin.withdrawal_pin);
        if (!isPinMatch) {
            return res.status(403).json({ message: 'Incorrect withdrawal PIN. Please try again.' });
        }

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

        // CREATE REQUEST
        const { onchain_tx_hash } = req.body;
        const isAutoApprove = !!onchain_tx_hash;

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

        if (!isAutoApprove && amount > availableBalance) {
            return res.status(400).json({
                message: `Insufficient balance. Available: ${Math.round(availableBalance * 100) / 100} (Pending: ${totalPending})`
            });
        }

        // 2. Additional check for level/mining (Matured balance)
        if (!isAutoApprove && (withdraw_type === 'level_income' || withdraw_type === 'mining_bonus')) {
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
                ]
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

            // Fetch approved withdrawals to deduct from matured balance
            const approvedWithdrawals = await Withdrawal.find({
                user_id: user.id || user.user_id || user._id.toString(),
                withdraw_type,
                approve: "1" // Approved
            });
            const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

            // Round to 2 decimal places for comparison to handle floating point issues
            const availableMaturedNet = Math.round((availableMatured - totalWithdrawn - totalPending) * 100) / 100;
            const requestedAmount = Math.round(Number(amount) * 100) / 100;

            if (requestedAmount > availableMaturedNet) {
                return res.status(400).json({
                    message: `Insufficient matured balance. Available: ${availableMaturedNet}`
                });
            }
        }

        const latestTokenRateRecord = await TokenRate.findOne({}).sort({ created_at: -1 });
        const activeRate = latestTokenRateRecord ? latestTokenRateRecord.rate : 14.40;

        const withdrawal = await Withdrawal.create({
            user_id: user.id || user.user_id || user._id.toString(),
            amount,
            payable_amount: Number(amount) * 0.85, // 15% deduction
            withdraw_type,
            method,
            source,
            bankDetails: finalBankDetails,
            approve: isAutoApprove ? "1" : "2", // Auto-approve if hash is present
            onchain_tx_hash: onchain_tx_hash || "",
            token_rate: activeRate,
            remark: remark || ""
        });

        // 3. If auto-approved (on-chain), deduct balance IMMEDIATELY
        if (isAutoApprove) {
            if (withdraw_type === 'mining_bonus') {
                user.mining_bonus = Math.max(0, (user.mining_bonus || 0) - amount);
            } else if (withdraw_type === 'annual_bonus') {
                user.anual_bonus = Math.max(0, (user.anual_bonus || 0) - amount);
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
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const query = {};

        // Datewise filter (by create_at)
        if (req.query.startDate || req.query.endDate) {
            query.create_at = {};
            if (req.query.startDate) {
                const start = new Date(req.query.startDate);
                start.setHours(0, 0, 0, 0);
                query.create_at.$gte = start;
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                query.create_at.$lte = end;
            }
        }

        // Typewise filter
        if (req.query.type && req.query.type !== 'all') {
            if (req.query.type === 'level_income') {
                query.withdraw_type = { $in: ['level_income', 'level'] };
            } else {
                query.withdraw_type = req.query.type;
            }
        }

        // Status filter
        if (req.query.status && req.query.status !== 'all') {
            if (req.query.status === 'pending') query.approve = "2";
            else if (req.query.status === 'approved') query.approve = "1";
            else if (req.query.status === 'rejected') query.approve = "0";
        }

        // ── Server-side in-memory cache ────────────────────────────────────────
        // Check cache before touching the database
        const cacheKey = buildCacheKey({ page, limit, query: JSON.stringify(query) });
        const cached = withdrawalsCache.get(cacheKey);
        if (cached && cached.expiry > Date.now()) {
            return res.status(200).json(cached.data);
        }

        // Use Promise.all to fetch total and withdrawals concurrently
        const [total, withdrawals] = await Promise.all([
            Withdrawal.countDocuments(query),
            Withdrawal.find(query)
                .select('user_id amount payable_amount withdraw_type method source bankDetails approve onchain_tx_hash token_rate remark create_at')
                .sort({ create_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        if (withdrawals.length === 0) {
            const emptyResult = { withdrawals: [], page, pages: Math.ceil(total / limit) || 1, total };
            withdrawalsCache.set(cacheKey, { data: emptyResult, expiry: Date.now() + CACHE_TTL_MS });
            return res.status(200).json(emptyResult);
        }

        // Fetch token rates for dynamic resolution of historical rate if missing
        // Load all rates once into memory if needed to avoid N+1 query problem
        let allRates = [];
        if (withdrawals.some(w => !w.token_rate)) {
            allRates = await TokenRate.find({}).sort({ created_at: -1 }).lean();
        }

        const historicalDate = new Date('2025-10-01T00:00:00.000Z');
        for (let w of withdrawals) {
            if (!w.token_rate) {
                const wDate = new Date(w.create_at || w.createdAt);
                const activeRateObj = allRates.find(r => new Date(r.created_at || r.createdAt) <= wDate);
                if (activeRateObj) {
                    w.token_rate = activeRateObj.rate;
                } else if (wDate >= historicalDate) {
                    w.token_rate = 4;
                } else {
                    w.token_rate = 14.40;
                }
            }
        }

        // Get unique user_ids from withdrawals on the CURRENT page
        const userIds = [...new Set(withdrawals.map(w => w.user_id))].filter(Boolean);

        // Find users with these custom user_ids
        const validObjIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        const userOrConditions = [];
        if (userIds.length > 0) {
            userOrConditions.push({ user_id: { $in: userIds } });
            userOrConditions.push({ id: { $in: userIds } });
        }
        if (validObjIds.length > 0) {
            userOrConditions.push({ _id: { $in: validObjIds } });
        }

        const users = userOrConditions.length > 0
            ? await User.find({ $or: userOrConditions }).select('user_id id referral_id full_name email').lean()
            : [];

        // Create a map for quick lookup
        const userMap = {};
        users.forEach(user => {
            if (user.user_id) userMap[user.user_id] = user;
            if (user.id) userMap[user.id] = user;
            if (user._id) userMap[user._id.toString()] = user;
        });

        // Query MyAccount records for bank details
        const MyAccount = require('../models/MyAccount');
        const myAccountUserIds = [];
        users.forEach(user => {
            if (user.id) myAccountUserIds.push(user.id);
            if (user.user_id) myAccountUserIds.push(user.user_id);
            if (user._id) myAccountUserIds.push(user._id.toString());
        });
        userIds.forEach(id => myAccountUserIds.push(id));
        const uniqueMyAccountUserIds = [...new Set(myAccountUserIds)].filter(Boolean);

        const accounts = uniqueMyAccountUserIds.length > 0
            ? await MyAccount.find({ user_id: { $in: uniqueMyAccountUserIds } }).select('user_id acc_num acc_name back_code back_name branch').lean()
            : [];

        const accountMap = {};
        accounts.forEach(acc => { accountMap[acc.user_id] = acc; });

        // Build flat, lean response rows (no nested user_id object)
        const populatedWithdrawals = withdrawals.map(w => {
            const user = userMap[w.user_id] || {};

            // Resolve bank details from embedded record or MyAccount fallback
            let finalBankDetails = w.bankDetails;
            if (!finalBankDetails) {
                const possibleIds = [
                    w.user_id, user.id, user.user_id,
                    user._id ? user._id.toString() : null
                ].filter(Boolean);
                for (const id of possibleIds) {
                    if (accountMap[id]) {
                        const acc = accountMap[id];
                        finalBankDetails = {
                            accountHolderName: acc.acc_name,
                            accountNumber: acc.acc_num,
                            ifscCode: acc.back_code,
                            bankName: acc.back_name
                        };
                        break;
                    }
                }
            } else {
                // Trim embedded bankDetails to only necessary fields for the UI
                finalBankDetails = {
                    accountHolderName: w.bankDetails.accountHolderName || w.bankDetails.account_holder_name,
                    accountNumber: w.bankDetails.accountNumber || w.bankDetails.account_number,
                    ifscCode: w.bankDetails.ifscCode || w.bankDetails.ifsc_code,
                    bankName: w.bankDetails.bankName || w.bankDetails.bank_name
                };
            }

            return {
                _id: w._id,
                // Flat user fields instead of nested object
                userName: user.full_name || 'Unknown User',
                referralId: user.referral_id || 'N/A',
                // Core withdrawal fields
                amount: w.amount,
                payable_amount: w.payable_amount,
                withdraw_type: w.withdraw_type,
                method: w.method,
                approve: w.approve,
                token_rate: w.token_rate || 14.40,
                remark: w.remark,
                create_at: w.create_at,
                bankDetails: finalBankDetails
            };
        });

        const result = {
            withdrawals: populatedWithdrawals,
            page,
            pages: Math.ceil(total / limit),
            total
        };

        // Store in cache
        withdrawalsCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL_MS });

        res.status(200).json(result);
    } catch (error) {
        console.error("GetAllWithdrawals Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update withdrawal status (Admin)
// @route   PUT /api/withdrawals/:id
// @access  Private/Admin
const updateWithdrawalStatus = async (req, res) => {
    const { approve } = req.body; // 1: Approve, 0: Reject
    // Invalidate the admin list cache so the next load reflects the change
    invalidateWithdrawalsCache();

    try {
        const withdrawal = await Withdrawal.findById(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({ message: 'Withdrawal request not found' });
        }

        // Fetch user upfront
        const user = await User.findOne({
            $or: [
                { id: withdrawal.user_id },
                { user_id: withdrawal.user_id },
                { _id: mongoose.Types.ObjectId.isValid(withdrawal.user_id) ? withdrawal.user_id : null }
            ].filter(q => q._id || q.id || q.user_id)
        });

        // Only process deduction if status is transitioning from pending to approved
        if (withdrawal.approve == "2" && approve == 1) {
            if (!user) {
                return res.status(404).json({ message: 'User not found for this withdrawal' });
            }

            const amount = withdrawal.amount;
            const type = withdrawal.withdraw_type;

            if (type === 'level_income' || type === 'level') {
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

        // Create notification for user
        if (user) {
            try {
                await Notification.create({
                    user_id: user._id,
                    message: approve == 1
                        ? `Your withdrawal request of ₹${withdrawal.amount} has been approved.`
                        : `Your withdrawal request of ₹${withdrawal.amount} has been rejected.`,
                    type: 'withdrawal',
                    path: '/withdrawal'
                });
            } catch (err) {
                console.error("Failed to create withdrawal status notification:", err);
            }
        }

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
