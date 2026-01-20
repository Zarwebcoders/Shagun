const Payment = require('../models/Payment');

// @desc    Create a new payment (manually or via other flow)
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
    const { transaction_id, amount, vendor_id, user_id } = req.body;

    try {
        const payment = await Payment.create({
            transaction_id: transaction_id || `TXN${Date.now()}`,
            user_id: user_id || req.user.id, // Allow passing user_id or use logged in user
            amount: Number(amount),
            approve: 2, // Default Pending
            vendor_id: vendor_id || "",
            created_at: new Date()
        });

        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private/Admin
const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find({}).sort({ created_at: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my payments (User)
// @route   GET /api/payments/my
// @access  Private
const getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user_id: req.user.id }).sort({ created_at: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Update payment approve status
// @route   PUT /api/payments/:id
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
    try {
        const { approve } = req.body; // Expecting Number: 0, 1, 2
        const payment = await Payment.findById(req.params.id);

        if (payment) {
            payment.approve = approve;
            await payment.save();
            res.json(payment);
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPayment,
    getPayments,
    getMyPayments,
    updatePaymentStatus
};
