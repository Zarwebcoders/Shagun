const VendorWallet = require('../models/VendorWallet');

// @desc    Add Vendor Wallet
// @route   POST /api/vendor-wallet
// @access  Public/Private
const addWallet = async (req, res) => {
    const { vendor_id, wallet_add } = req.body;

    if (!vendor_id || !wallet_add) {
        return res.status(400).json({ message: 'Please provide vendor_id and wallet_add' });
    }

    try {
        const wallet = await VendorWallet.create({
            vendor_id,
            wallet_add,
            approve: 2
        });

        res.status(201).json(wallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all vendor wallets (Admin)
// @route   GET /api/vendor-wallet/all
// @access  Private/Admin
const getWallets = async (req, res) => {
    try {
        const wallets = await VendorWallet.find({}).sort({ createdAt: -1 });
        res.status(200).json(wallets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update wallet status
// @route   PUT /api/vendor-wallet/:id
// @access  Private/Admin
const updateStatus = async (req, res) => {
    const { approve } = req.body;
    try {
        const wallet = await VendorWallet.findById(req.params.id);
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

        wallet.approve = approve;
        await wallet.save();
        res.status(200).json(wallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addWallet, getWallets, updateStatus };
