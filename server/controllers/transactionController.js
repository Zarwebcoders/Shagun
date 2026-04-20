const Transaction = require('../models/Transaction');
const User = require('../models/User');

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
            const query = {};
            if (req.query.type && req.query.type !== 'all') {
                query.type = req.query.type;
            }

            transactions = await Transaction.find(query)
                .populate('user', 'full_name email wallet')
                .populate('relatedUser', 'full_name')
                .sort({ createdAt: -1 })
                .lean();

            // Fetch KYC details for users to get bank info
            // Get unique user IDs from transactions (handle both populated objects and raw IDs)
            const userIds = [...new Set(transactions.map(t => {
                if (t.user?._id) return t.user._id.toString();
                if (t.user) return t.user.toString();
                return null;
            }).filter(id => id))];

            const kycRecords = await KYC.find({ user_id: { $in: userIds } }).lean();

            // Map KYC to user ID for easy lookup
            const kycMap = {};
            kycRecords.forEach(kyc => {
                if (kyc.user_id) kycMap[kyc.user_id.toString()] = kyc;
            });

            // Attach bank details to transactions
            transactions = transactions.map(t => {
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
