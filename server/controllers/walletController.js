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
        const wallets = await Wallet.find().populate('user_id', 'full_name email');
        res.status(200).json(wallets);
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

module.exports = {
    addOrUpdateWallet,
    getMyWallet,
    getAllWallets,
    getWalletByUser
};
