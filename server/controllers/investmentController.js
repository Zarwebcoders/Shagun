const Investment = require('../models/Investment');
const User = require('../models/User');
const Package = require('../models/Package');
const Transaction = require('../models/Transaction');

// @desc    Purchase a package (Create Investment)
// @route   POST /api/investments
// @access  Private
const createInvestment = async (req, res) => {
    const { packageId, amount, transactionId } = req.body;

    try {
        const pkg = await Package.findById(packageId);
        if (!pkg) {
            return res.status(404).json({ message: 'Package not found' });
        }

        // Validate amount
        if (amount < pkg.minInvestment || (pkg.maxInvestment !== 'Unlimited' && amount > pkg.maxInvestment)) {
            return res.status(400).json({ message: `Investment amount must be between ${pkg.minInvestment} and ${pkg.maxInvestment}` });
        }

        const user = await User.findById(req.user.id);

        // For this demo, we assume the user has deposited funds and is paying from balance.
        // Or if transactionId is provided, it's a manual payment request pending approval.
        // Let's implement balance payment for now.

        if (user.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Deduct balance
        user.balance -= Number(amount);
        await user.save();

        // Calculate end date based on duration (days)
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + parseInt(pkg.duration));

        // Create Investment
        const investment = await Investment.create({
            user: req.user.id,
            package: pkg._id,
            amount,
            dailyReturn: pkg.dailyReturn,
            dailyReturnAmount: (amount * pkg.dailyReturn) / 100,
            startDate,
            endDate,
            transactionId: transactionId || `INV${Date.now()}`,
            status: 'active'
        });

        // Create Transaction Record
        await Transaction.create({
            user: req.user.id,
            type: 'investment',
            amount,
            description: `Investment in ${pkg.name} package`,
            status: 'completed',
            hash: transactionId || `INV${Date.now()}`
        });

        res.status(201).json(investment);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user investments
// @route   GET /api/investments
// @access  Private
const getInvestments = async (req, res) => {
    try {
        const investments = await Investment.find({ user: req.user.id })
            .populate('package', 'name duration dailyReturn')
            .sort({ createdAt: -1 });
        res.json(investments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createInvestment,
    getInvestments,
};
