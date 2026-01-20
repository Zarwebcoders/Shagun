const MyAccount = require('../models/MyAccount');

// @desc    Add or Update Bank Details
// @route   POST /api/my-account
// @access  Private
const addBankDetails = async (req, res) => {
    const { back_name, acc_name, branch, back_code, acc_num } = req.body;

    try {
        // Check if account already exists for user
        let account = await MyAccount.findOne({ user_id: req.user.id });

        if (account) {
            // Update existing
            account.back_name = back_name || account.back_name;
            account.acc_name = acc_name || account.acc_name;
            account.branch = branch || account.branch;
            account.back_code = back_code || account.back_code;
            account.acc_num = acc_num || account.acc_num;
            account.approve = 2; // Reset to pending on update

            await account.save();
            res.json(account);
        } else {
            // Create new
            account = await MyAccount.create({
                user_id: req.user.id,
                back_name,
                acc_name,
                branch,
                back_code,
                acc_num,
                approve: 2 // Pending
            });
            res.status(201).json(account);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get My Bank Details
// @route   GET /api/my-account
// @access  Private
const getBankDetails = async (req, res) => {
    try {
        const account = await MyAccount.findOne({ user_id: req.user.id });
        if (account) {
            res.json(account);
        } else {
            res.status(404).json({ message: 'No bank details found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Bank Requests (Admin)
// @route   GET /api/my-account/all
// @access  Private/Admin
const getAllBankRequests = async (req, res) => {
    try {
        const accounts = await MyAccount.find({}).populate('user_id', 'name email').sort({ _id: -1 });
        // Note: user_id is Ref to User. If user_id is stored as String, populate might need adjustment or ensure User model is compatible.
        // Assuming user_id stores ObjectId string which matches User _id.
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Bank Status (Admin)
// @route   PUT /api/my-account/:id
// @access  Private/Admin
const updateBankStatus = async (req, res) => {
    try {
        const { approve } = req.body;
        const account = await MyAccount.findById(req.params.id);

        if (account) {
            account.approve = approve;
            await account.save();
            res.json(account);
        } else {
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addBankDetails,
    getBankDetails,
    getAllBankRequests,
    updateBankStatus
};
