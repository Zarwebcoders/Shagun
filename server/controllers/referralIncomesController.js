const ReferralIncomes = require('../models/ReferralIncomes');

// @desc    Get my referral incomes
// @route   GET /api/referral-incomes/my-referrals
// @access  Private
const getMyReferrals = async (req, res) => {
    try {
        // Assuming req.user.user_id is the numerical ID
        const incomes = await ReferralIncomes.find({ earner_user_id: req.user.user_id }).sort({ create_at: -1 });
        res.status(200).json(incomes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add referral income (Internal/Admin)
// @route   POST /api/referral-incomes
// @access  Private/Admin
const addReferralIncome = async (req, res) => {
    const {
        earner_user_id,
        referred_user_id,
        product_id,
        product_transcation_id,
        amount,
        percentage,
        referral_amount,
        status
    } = req.body;

    if (!earner_user_id || !referred_user_id || !amount) {
        return res.status(400).json({ message: 'Please provide required fields' });
    }

    try {
        const income = await ReferralIncomes.create({
            earner_user_id,
            referred_user_id,
            product_id: product_id || null,
            product_transcation_id: product_transcation_id || null,
            amount,
            percentage: percentage || 8.00,
            referral_amount: referral_amount || 0.00,
            status: status || 'credited'
        });
        res.status(201).json(income);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMyReferrals, addReferralIncome };
