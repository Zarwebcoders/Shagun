const Transaction = require('../models/Transaction');
const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');
const Payment = require('../models/Payment');
const Withdrawal = require('../models/Withdrawal');

// @desc    Get all transactions (Admin: all, User: own)
// @route   GET /api/transactions
// @access  Private
const KYC = require('../models/KYC');

// @desc    Get all transactions (Admin: all, User: own)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
    try {
        let transactions;
        if (req.user.is_admin === 1 || req.user.is_admin === "1") {
            const typeFilter = req.query.type || 'all';

            // Build a map of all users for quick lookup
            const usersList = await User.find({}).select('_id user_id id full_name email referral_id wallet').lean();
            const userMap = {};
            usersList.forEach(u => {
                if (u._id) userMap[u._id.toString()] = u;
                if (u.id) userMap[u.id] = u;
                if (u.user_id) userMap[u.user_id] = u;
            });

            let txPromise = Promise.resolve([]);
            let levelPromise = Promise.resolve([]);
            let depositPromise = Promise.resolve([]);
            let withdrawalPromise = Promise.resolve([]);

            if (typeFilter === 'all') {
                txPromise = Transaction.find({}).populate('user', 'full_name email wallet user_id referral_id').populate('relatedUser', 'full_name user_id referral_id').lean();
                levelPromise = LevelIncome.find({}).lean();
                depositPromise = Payment.find({}).lean();
                withdrawalPromise = Withdrawal.find({}).lean();
            } else if (typeFilter === 'level_income') {
                levelPromise = LevelIncome.find({}).lean();
            } else if (typeFilter === 'deposit') {
                depositPromise = Payment.find({}).lean();
            } else if (typeFilter === 'withdrawal') {
                withdrawalPromise = Withdrawal.find({}).lean();
            } else {
                txPromise = Transaction.find({ type: typeFilter }).populate('user', 'full_name email wallet user_id referral_id').populate('relatedUser', 'full_name user_id referral_id').lean();
            }

            const [txList, levelList, depositList, withdrawalList] = await Promise.all([
                txPromise,
                levelPromise,
                depositPromise,
                withdrawalPromise
            ]);

            const aggregated = [];

            // 1. Process Transaction records
            txList.forEach(t => {
                aggregated.push({
                    ...t,
                    createdAt: t.createdAt || t.created_at || new Date()
                });
            });

            // 2. Process LevelIncome records
            levelList.forEach(li => {
                const user = userMap[li.user_id] || { _id: li.user_id };
                const relatedUser = userMap[li.from_user_id] || { _id: li.from_user_id };
                aggregated.push({
                    _id: li._id,
                    user,
                    relatedUser,
                    type: 'level_income',
                    amount: li.amount,
                    currency: 'INR',
                    crypto: 'None',
                    hash: '',
                    status: 'completed',
                    description: `Level ${li.level} Income`,
                    createdAt: li.created_at || li.create_at || new Date()
                });
            });

            // 3. Process Payment records (Deposits)
            depositList.forEach(p => {
                const user = userMap[p.user_id] || { _id: p.user_id };
                aggregated.push({
                    _id: p._id,
                    user,
                    relatedUser: null,
                    type: 'deposit',
                    amount: parseFloat(p.amount) || 0,
                    currency: 'INR',
                    crypto: 'None',
                    hash: p.transaction_id || '',
                    status: p.approve === 1 || p.approve === "1" ? 'completed' : (p.approve === 0 || p.approve === "0" ? 'failed' : 'pending'),
                    description: p.vendor_id ? `Deposit via Vendor ${p.vendor_id}` : 'Deposit',
                    createdAt: p.created_at || new Date()
                });
            });

            // 4. Process Withdrawal records
            withdrawalList.forEach(w => {
                const user = userMap[w.user_id] || { _id: w.user_id };
                aggregated.push({
                    _id: w._id,
                    user,
                    relatedUser: null,
                    type: 'withdrawal',
                    amount: w.amount,
                    currency: 'INR',
                    crypto: 'None',
                    hash: w.onchain_tx_hash || '',
                    status: w.approve === 1 || w.approve === "1" ? 'completed' : (w.approve === 0 || w.approve === "0" ? 'failed' : 'pending'),
                    description: w.withdraw_type ? `Withdrawal (${w.withdraw_type})` : 'Withdrawal',
                    createdAt: w.create_at || w.createdAt || new Date()
                });
            });

            // Sort aggregated results descending by createdAt
            aggregated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Fetch KYC details for users to get bank info
            const userIds = [...new Set(aggregated.map(t => {
                if (t.user?._id) return t.user._id.toString();
                if (t.user) return t.user.toString();
                return null;
            }).filter(id => id))];

            const kycRecords = await KYC.find({ user_id: { $in: userIds } }).lean();

            // Map KYC to user ID / other user ID representations for robust lookup
            const kycMap = {};
            kycRecords.forEach(kyc => {
                if (kyc.user_id) {
                    const kycUserId = kyc.user_id.toString();
                    kycMap[kycUserId] = kyc;
                    
                    const matchedUser = userMap[kycUserId];
                    if (matchedUser) {
                        if (matchedUser._id) kycMap[matchedUser._id.toString()] = kyc;
                        if (matchedUser.id) kycMap[matchedUser.id] = kyc;
                        if (matchedUser.user_id) kycMap[matchedUser.user_id] = kyc;
                    }
                }
            });

            // Attach bank details to transactions
            transactions = aggregated.map(t => {
                const userId = t.user?._id?.toString() || t.user?.toString();
                const kyc = kycMap[userId];
                return {
                    ...t,
                    bankDetails: kyc ? {
                        bank_name: kyc.bank_name,
                        acc_name: kyc.acc_name,
                        branch: kyc.branch,
                        ifsc_code: kyc.ifsc_code,
                        acc_num: kyc.acc_num
                    } : null
                };
            });

        } else {
            // Robust ID lookup for user's own transactions
            const mongoose = require('mongoose');
            const user = await User.findById(req.user._id).lean();
            if (!user) return res.status(404).json({ message: 'User not found' });

            const queryIds = [user._id, user.id, user.user_id].filter(id => id);
            const validObjectIds = queryIds.filter(id => mongoose.Types.ObjectId.isValid(id));

            transactions = await Transaction.find({ 
                $or: [
                    { user: { $in: validObjectIds } },
                    { user: { $in: queryIds.map(id => String(id)) } }
                ]
            })
                .populate('relatedUser', 'full_name')
                .sort({ createdAt: -1 });
        }
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
    const { type, amount, crypto, hash, description } = req.body;

    try {
        const transaction = await Transaction.create({
            user: req.user.id,
            type,
            amount,
            crypto,
            hash,
            description,
        });

        // Update user balance if deposit completed (Simplify logic for demo)
        // In real world, this would be done via webhook or admin approval
        if (type === 'deposit' && transaction.status === 'completed') {
            // Logic to update balance
        }

        // Deduct balance for purchase immediately (simplified)
        if (type === 'purchase') {
            const user = await User.findById(req.user.id);
            if (user.balance >= amount) {
                user.balance -= amount;
                transaction.status = 'completed';
                await user.save();
                await transaction.save();
            } else {
                transaction.status = 'failed';
                transaction.description = 'Insufficient balance';
                await transaction.save();
                return res.status(400).json({ message: 'Insufficient balance' });
            }
        }

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update transaction status (Admin)
// @route   PUT /api/transactions/:id
// @access  Private/Admin
const updateTransactionStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const transaction = await Transaction.findById(req.params.id);

        if (transaction) {
            transaction.status = status;
            await transaction.save();

            // If approved/completed, update balance logic here
            // This is a simplified example
            if (status === 'completed') {
                const user = await User.findById(transaction.user);
                if (transaction.type === 'deposit') {
                    user.balance += transaction.amount;
                } else if (transaction.type === 'withdrawal') {
                    user.balance -= transaction.amount;
                }
                await user.save();
            }

            res.json(transaction);
        } else {
            res.status(404).json({ message: 'Transaction not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Transaction stats (Admin)
// @route   GET /api/transactions/stats
// @access  Private/Admin
const getTransactionStats = async (req, res) => {
    try {
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);

        const [totalTransactions, pending, failed, today] = await Promise.all([
            Transaction.countDocuments({}),
            Transaction.countDocuments({ status: 'pending' }),
            Transaction.countDocuments({ status: 'failed' }),
            Transaction.countDocuments({ createdAt: { $gte: todayAtMidnight } })
        ]);

        const totalVolumeResult = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalVolume = totalVolumeResult.length > 0 ? totalVolumeResult[0].total : 0;

        res.json({
            totalTransactions,
            totalVolume,
            pending,
            failed,
            today
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTransactions,
    createTransaction,
    updateTransactionStatus,
    getTransactionStats,
};
