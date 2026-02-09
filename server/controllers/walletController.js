const Wallet = require('../models/Wallet');

// @desc    Add or Update Wallet
// @route   POST /api/wallet
// @access  Private
const addOrUpdateWallet = async (req, res) => {
    const { wallet_add } = req.body;
    const user_id = req.user.id; // user_id here is the ObjectId string from authMiddleware

    if (!wallet_add) {
        return res.status(400).json({ message: 'Wallet address is required' });
    }

    try {
        // 1. Check if this user already has a wallet
        let userWallet = await Wallet.findOne({ user_id });

        if (userWallet) {
            // If user already has a wallet, they can ONLY re-submit the SAME address
            // We compare case-insensitively usually for crypto addresses, or strict? 
            // Let's do strict for now or case-insensitive if appropriate. 
            // Usually EVM addresses are checksummed but it's safer to compare lowercase or exact.
            // Let's assume exact match requirement for simplicity but if they send different case it might fail? 
            // Let's normalize to lowercase for comparison if it's EVM/similar, or just strict string equality.
            // Requirement: "wo dobara koi dusra wallet connect nahi kar sakta... waha pe check kare ki jo dusra wallet hai wo same hai"

            if (userWallet.wallet_add !== wallet_add) {
                return res.status(400).json({ message: 'You cannot change your connected wallet address. Please contact admin if you need to change it.' });
            }

            // If same, update logic (maybe just re-save or do nothing? User might be retrying to trigger something?)
            // We can just return the existing wallet or update timestamp
            userWallet.wallet_add = wallet_add;
            // userWallet.approve = 2; // Don't reset approval if it's the same wallet? Or should we?
            // If it's the exact same wallet, maybe we don't need to do anything or just update it.
            // Let's save just in case.
            await userWallet.save();
        } else {
            // 2. Check if this wallet address is already used by ANOTHER user
            // We search for any wallet with this address
            const existingWallet = await Wallet.findOne({ wallet_add });

            if (existingWallet) {
                // It exists, and since we are in the 'else' block of userWallet, 
                // it implies it belongs to someone else (or data inconsistency where user_id mismatch).
                // Safe to say it's taken.
                return res.status(400).json({ message: 'This wallet address is already linked to another account.' });
            }

            // Create new wallet
            userWallet = await Wallet.create({
                user_id,
                wallet_add,
                approve: 2 // Pending
            });
        }
        res.status(200).json(userWallet);
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
