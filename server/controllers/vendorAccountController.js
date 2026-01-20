const VendorAccount = require('../models/VendorAccount');

// @desc    Add Vendor Account
// @route   POST /api/vendor-account
// @access  Public/Private
const addAccount = async (req, res) => {
    const { vendor_id, back_name, back_code, acc_num } = req.body;

    if (!vendor_id || !back_name || !back_code || !acc_num) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const account = await VendorAccount.create({
            vendor_id,
            back_name,
            back_code,
            acc_num,
            approve: 2 // Pending
        });

        res.status(201).json(account);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all vendor accounts (Admin)
// @route   GET /api/vendor-account/all
// @access  Private/Admin
const getAccounts = async (req, res) => {
    try {
        const accounts = await VendorAccount.find({}).sort({ createdAt: -1 });
        res.status(200).json(accounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update account status
// @route   PUT /api/vendor-account/:id
// @access  Private/Admin
const updateStatus = async (req, res) => {
    const { approve } = req.body;
    try {
        const account = await VendorAccount.findById(req.params.id);
        if (!account) return res.status(404).json({ message: 'Account not found' });

        account.approve = approve;
        await account.save();
        res.status(200).json(account);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addAccount, getAccounts, updateStatus };
