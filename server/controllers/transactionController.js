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
// Cache for transaction stats (recalculated every 5 min)
let txStatsCache = { data: null, expiry: 0 };

const getTransactions = async (req, res) => {
    try {
        const page     = Math.max(1, parseInt(req.query.page)  || 1);
        const limit    = Math.min(100, parseInt(req.query.limit) || 20);
        const skip     = (page - 1) * limit;
        const typeFilter = req.query.type  || 'all';
        const search     = (req.query.search || '').trim();
        const startDate  = req.query.startDate || '';
        const endDate    = req.query.endDate   || '';

        if (req.user.is_admin === 1 || req.user.is_admin === "1") {

            // ── Build date range filter ───────────────────────────────────
            let dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) {
                    const s = new Date(startDate); s.setHours(0, 0, 0, 0);
                    dateFilter.createdAt.$gte = s;
                }
                if (endDate) {
                    const e = new Date(endDate); e.setHours(23, 59, 59, 999);
                    dateFilter.createdAt.$lte = e;
                }
            }

            // ── Build type filter ─────────────────────────────────────────
            let txFilter = { ...dateFilter };
            if (typeFilter !== 'all' && typeFilter !== 'level_income' && typeFilter !== 'deposit' && typeFilter !== 'withdrawal') {
                txFilter.type = typeFilter;
            }

            // ── Search: resolve user IDs by name/email first ──────────────
            let matchedUserObjectIds = [];
            if (search) {
                const matchedUsers = await User.find({
                    $or: [
                        { full_name:   { $regex: search, $options: 'i' } },
                        { email:       { $regex: search, $options: 'i' } },
                        { referral_id: { $regex: search, $options: 'i' } }
                    ]
                }).select('_id').lean();
                matchedUserObjectIds = matchedUsers.map(u => u._id);
            }

            let aggregated = [];
            let total = 0;

            if (typeFilter === 'level_income') {
                // ── LevelIncome only ──────────────────────────────────────
                const liFilter = {};
                if (startDate || endDate) {
                    liFilter.created_at = {};
                    if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); liFilter.created_at.$gte = s; }
                    if (endDate)   { const e = new Date(endDate);   e.setHours(23,59,59,999); liFilter.created_at.$lte = e; }
                }
                total = await LevelIncome.countDocuments(liFilter);
                const levelList = await LevelIncome.find(liFilter).sort({ created_at: -1 }).skip(skip).limit(limit).lean();

                const allIds = [...new Set([...levelList.map(l => l.user_id), ...levelList.map(l => l.from_user_id)].filter(Boolean))];
                const users = await User.find({ $or: [{ _id: { $in: allIds } }, { id: { $in: allIds } }, { user_id: { $in: allIds } }] }).select('_id id user_id full_name email referral_id').lean();
                const userMap = {};
                users.forEach(u => { if (u._id) userMap[u._id.toString()] = u; if (u.id) userMap[String(u.id)] = u; if (u.user_id) userMap[String(u.user_id)] = u; });

                aggregated = levelList.map(li => ({
                    _id: li._id, user: userMap[li.user_id] || { _id: li.user_id },
                    relatedUser: userMap[li.from_user_id] || null,
                    type: 'level_income', amount: li.amount, currency: 'INR', crypto: 'None',
                    hash: '', status: 'completed', description: `Level ${li.level} Income`,
                    createdAt: li.created_at || li.create_at || new Date(), bankDetails: null
                }));

            } else if (typeFilter === 'deposit') {
                // ── Payments (Deposits) only ──────────────────────────────
                const pFilter = {};
                if (startDate || endDate) {
                    pFilter.created_at = {};
                    if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); pFilter.created_at.$gte = s; }
                    if (endDate)   { const e = new Date(endDate);   e.setHours(23,59,59,999); pFilter.created_at.$lte = e; }
                }
                if (search && matchedUserObjectIds.length) pFilter.user_id = { $in: matchedUserObjectIds.map(String) };
                total = await Payment.countDocuments(pFilter);
                const depositList = await Payment.find(pFilter).sort({ created_at: -1 }).skip(skip).limit(limit).lean();
                const dIds = [...new Set(depositList.map(p => p.user_id).filter(Boolean))];
                const dUsers = await User.find({ $or: [{ _id: { $in: dIds } }, { id: { $in: dIds } }, { user_id: { $in: dIds } }] }).select('_id id user_id full_name email referral_id').lean();
                const dMap = {}; dUsers.forEach(u => { if (u._id) dMap[u._id.toString()] = u; if (u.id) dMap[String(u.id)] = u; if (u.user_id) dMap[String(u.user_id)] = u; });
                aggregated = depositList.map(p => ({
                    _id: p._id, user: dMap[p.user_id] || { _id: p.user_id }, relatedUser: null,
                    type: 'deposit', amount: parseFloat(p.amount) || 0, currency: 'INR', crypto: 'None',
                    hash: p.transaction_id || '',
                    status: p.approve === 1 || p.approve === "1" ? 'completed' : (p.approve === 0 || p.approve === "0" ? 'failed' : 'pending'),
                    description: 'Deposit', createdAt: p.created_at || new Date(), bankDetails: null
                }));

            } else if (typeFilter === 'withdrawal') {
                // ── Withdrawals only ──────────────────────────────────────
                const wFilter = {};
                if (startDate || endDate) {
                    wFilter.create_at = {};
                    if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); wFilter.create_at.$gte = s; }
                    if (endDate)   { const e = new Date(endDate);   e.setHours(23,59,59,999); wFilter.create_at.$lte = e; }
                }
                if (search && matchedUserObjectIds.length) wFilter.user_id = { $in: matchedUserObjectIds.map(String) };
                total = await Withdrawal.countDocuments(wFilter);
                const wList = await Withdrawal.find(wFilter).sort({ create_at: -1 }).skip(skip).limit(limit).lean();
                const wIds = [...new Set(wList.map(w => w.user_id).filter(Boolean))];
                const wUsers = await User.find({ $or: [{ _id: { $in: wIds } }, { id: { $in: wIds } }, { user_id: { $in: wIds } }] }).select('_id id user_id full_name email referral_id').lean();
                const wMap = {}; wUsers.forEach(u => { if (u._id) wMap[u._id.toString()] = u; if (u.id) wMap[String(u.id)] = u; if (u.user_id) wMap[String(u.user_id)] = u; });
                aggregated = wList.map(w => ({
                    _id: w._id, user: wMap[w.user_id] || { _id: w.user_id }, relatedUser: null,
                    type: 'withdrawal', amount: w.amount, currency: 'INR', crypto: 'None',
                    hash: w.onchain_tx_hash || '',
                    status: w.approve === 1 || w.approve === "1" ? 'completed' : (w.approve === 2 || w.approve === "2" ? 'pending' : 'failed'),
                    description: w.withdraw_type ? `Withdrawal (${w.withdraw_type})` : 'Withdrawal',
                    createdAt: w.create_at || w.createdAt || new Date(), bankDetails: null
                }));

            } else {
                // ── Transaction table (all or specific type) ──────────────
                if (search && matchedUserObjectIds.length) {
                    txFilter.user = { $in: matchedUserObjectIds };
                } else if (search) {
                    txFilter.description = { $regex: search, $options: 'i' };
                }
                // convert createdAt filter key for Transaction model
                if (dateFilter.createdAt) txFilter.createdAt = dateFilter.createdAt;

                total = await Transaction.countDocuments(txFilter);
                const txList = await Transaction.find(txFilter)
                    .populate('user', 'full_name email referral_id user_id')
                    .populate('relatedUser', 'full_name user_id referral_id')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean();

                aggregated = txList.map(t => ({ ...t, bankDetails: null }));
            }

            return res.json({
                transactions: aggregated,
                page,
                pages: Math.ceil(total / limit),
                total
            });

        } else {
            // ── Regular user: own transactions only ───────────────────────
            const mongoose = require('mongoose');
            const user = await User.findById(req.user._id).lean();
            if (!user) return res.status(404).json({ message: 'User not found' });

            const filter = {
                $or: [
                    { user: user._id },
                    { user: user.id ? String(user.id) : null },
                ].filter(f => Object.values(f)[0])
            };

            const total = await Transaction.countDocuments(filter);
            const transactions = await Transaction.find(filter)
                .populate('relatedUser', 'full_name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            return res.json({ transactions, page, pages: Math.ceil(total / limit), total });
        }
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
