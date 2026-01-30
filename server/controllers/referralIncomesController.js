const User = require('../models/User');
const ReferralIncomes = require('../models/ReferralIncomes');

// @desc    Get my referral incomes
// @route   GET /api/referral-incomes/my-referrals
// @access  Private
const getMyReferrals = async (req, res) => {
    try {
        // Fetch raw user document to get the legacy numeric 'id' field
        // which is not in the Mongoose schema but exists in DB
        const user = await User.findById(req.user._id).lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Query using the numeric id (e.g., "827") instead of user_id ("SGN824")
        const queryId = user.id || user.user_id;

        const incomes = await ReferralIncomes.find({ earner_user_id: queryId }).sort({ create_at: -1 }).lean();

        // Collect all referred_user_ids to fetch names
        const referredIds = incomes.map(inc => inc.referred_user_id);

        // Find users with these numeric IDs
        const users = await User.find({ id: { $in: referredIds } }).select('id full_name user_id').lean();

        // Create a map for quick lookup: { "4": { full_name: "John", user_id: "SGN004" } }
        const userMap = {};
        users.forEach(u => {
            userMap[u.id] = u;
        });

        // Attach user details to incomes
        const incomesWithDetails = incomes.map(inc => ({
            ...inc,
            referred_user_name: userMap[inc.referred_user_id]?.full_name || 'Unknown',
            referred_user_official_id: userMap[inc.referred_user_id]?.user_id || inc.referred_user_id
        }));

        res.status(200).json(incomesWithDetails);
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
