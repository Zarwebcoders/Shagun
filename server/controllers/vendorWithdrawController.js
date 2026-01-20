const VendorWithdraw = require('../models/VendorWithdraw');

// @desc    Create new vendor withdrawal request
// @route   POST /api/vendor-withdraw
// @access  Public (or Private if we want to enforce auth, but schema implies just vendor_id string)
const createRequest = async (req, res) => {
    const { vendor_id, amount } = req.body;

    if (!vendor_id || !amount) {
        return res.status(400).json({ message: 'Please provide vendor_id and amount' });
    }

    try {
        const withdrawal = await VendorWithdraw.create({
            vendor_id,
            amount,
            approve: 2 // Default to pending
        });

        res.status(201).json(withdrawal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all vendor withdrawals (Admin)
// @route   GET /api/vendor-withdraw/all
// @access  Private/Admin
const getAllRequests = async (req, res) => {
    try {
        const withdrawals = await VendorWithdraw.find({})
            .sort({ create_at: -1 });
        res.status(200).json(withdrawals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update vendor withdrawal status (Admin)
// @route   PUT /api/vendor-withdraw/:id
// @access  Private/Admin
const updateStatus = async (req, res) => {
    const { approve } = req.body; // 1: Approve, 0: Reject

    try {
        const withdrawal = await VendorWithdraw.findById(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({ message: 'Request not found' });
        }

        withdrawal.approve = approve;
        await withdrawal.save();

        res.status(200).json(withdrawal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRequest,
    getAllRequests,
    updateStatus
};
