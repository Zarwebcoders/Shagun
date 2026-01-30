const Wallet = require('../models/Wallet');

// @desc    Add or Update Wallet
// @route   POST /api/wallet
// @access  Private
const addOrUpdateWallet = async (req, res) => {
    const { wallet_add } = req.body;
    const user_id = req.user.id;

    if (!wallet_add) {
        return res.status(400).json({ message: 'Wallet address is required' });
    }

    try {
        let wallet = await Wallet.findOne({ user_id });

        if (wallet) {
            wallet.wallet_add = wallet_add;
            // wallet.approve = 2; // Optional: Reset approval on change? Keeping it simple for now, user didn't specify.
            await wallet.save();
        } else {
            wallet = await Wallet.create({
                user_id,
                wallet_add,
                approve: 2
            });
        }
        res.status(200).json(wallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Current User Wallet
// @route   GET /api/wallet/me
// @access  Private
const getMyWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ user_id: req.user.id });
        res.status(200).json(wallet || {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Wallets (Admin)
// @route   GET /api/wallet/all
// @access  Private/Admin
const getAllWallets = async (req, res) => {
    try {
        const User = require('../models/User'); // Import User for search
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        let query = {};

        if (search) {
            // Find users matching search
            const matchingUsers = await User.find({
                $or: [
                    { full_name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { user_id: { $regex: search, $options: 'i' } } // searching custom string ID
                ]
            }).select('_id');

            const matchingUserIds = matchingUsers.map(u => u._id);

            query = {
                $or: [
                    { user_id: { $in: matchingUserIds } },
                    { wallet_add: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Get Stats
        const [totalApproved, totalRejected, totalPending] = await Promise.all([
            Wallet.countDocuments({ approve: 1 }),
            Wallet.countDocuments({ approve: 0 }),
            Wallet.countDocuments({ approve: 2 })
        ]);

        // Get Data
        const [total, wallets] = await Promise.all([
            Wallet.countDocuments(query),
            Wallet.find(query)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        // Manual Populate User Logic
        // Fetch ALL users to ensure we don't miss any due to query mismatch or whitespace
        const users = await User.find({}).select('_id user_id id full_name email').lean();

        const userMap = {};
        users.forEach(u => {
            userMap[u._id.toString()] = u;
            if (u.user_id) userMap[String(u.user_id).trim()] = u;
            if (u.id) userMap[String(u.id).trim()] = u;
        });

        const populatedWallets = wallets.map(w => ({
            ...w,
            user_id: userMap[String(w.user_id).trim()] || { full_name: 'Unknown User', email: 'N/A', user_id: w.user_id }
        }));

        res.status(200).json({
            wallets: populatedWallets,
            page,
            pages: Math.ceil(total / limit),
            total,
            stats: {
                approved: totalApproved,
                rejected: totalRejected,
                pending: totalPending
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Specific User Wallet (Admin)
// @route   GET /api/wallet/user/:id
// @access  Private/Admin
const getWalletByUser = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ user_id: req.params.id });
        res.status(200).json(wallet || {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Wallet Status (Admin)
// @route   PUT /api/wallet/:id
// @access  Private/Admin
const updateWalletStatus = async (req, res) => {
    try {
        const { approve } = req.body;
        const wallet = await Wallet.findById(req.params.id);

        if (wallet) {
            wallet.approve = approve;
            await wallet.save();
            res.status(200).json(wallet);
        } else {
            res.status(404).json({ message: 'Wallet not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addOrUpdateWallet,
    getMyWallet,
    getAllWallets,
    getWalletByUser,
    updateWalletStatus
};
