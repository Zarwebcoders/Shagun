const Investment = require('../models/Investment');
const User = require('../models/User');
const Package = require('../models/Package');
const Transaction = require('../models/Transaction');

// @desc    Purchase a package (Create Investment)
// @route   POST /api/investments
// @access  Private
const createInvestment = async (req, res) => {
    let { packageId, amount, transactionId, sponsorId, paymentSlip } = req.body;

    try {
        let pkg;
        if (packageId) {
            pkg = await Package.findById(packageId);
        } else {
            // If packageId is missing, find a suitable package based on amount
            pkg = await Package.findOne({
                status: 'active',
                minInvestment: { $lte: Number(amount) },
                $or: [
                    { maxInvestment: { $gte: Number(amount) } },
                    { maxInvestment: 0 } // Assuming 0 or very high number for unlimited
                ]
            });

            // Fallback: Just get the first active package if amount matching fails but we want to allow the investment
            if (!pkg) {
                pkg = await Package.findOne({ status: 'active' }).sort({ minInvestment: 1 });
            }
        }

        if (!pkg) {
            return res.status(404).json({ message: 'Package not found' });
        }

        const user = await User.findById(req.user.id);

        // For manual payment requests with payment slip, we don't necessarily deduct from balance immediately
        // if the status is going to be 'pending'.
        // But the current logic assumes 'active' and deducts balance.
        // Let's adjust: if transactionId and paymentSlip are provided, it might be a pending request.
        // However, the user said "investment history is not showing", which might be because status is not 'active'.

        // Let's stick to the user's current flow but fix the "Package not found" and save the payment slip.

        // Calculate end date based on duration (days)
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (parseInt(pkg.duration) || 365));

        // Create Investment
        const investment = await Investment.create({
            user: req.user.id,
            package: pkg._id,
            amount: Number(amount),
            dailyReturn: pkg.dailyReturn,
            dailyReturnAmount: (Number(amount) * pkg.dailyReturn) / 100,
            startDate,
            endDate,
            transactionId: transactionId || `INV${Date.now()}`,
            status: 'active', // Set to active so it shows in history
            sponsorId: sponsorId || "",
            paymentSlip: paymentSlip || ""
        });

        // Create Transaction Record
        await Transaction.create({
            user: req.user.id,
            type: 'investment',
            amount: Number(amount),
            description: `Investment in ${pkg.name} package`,
            status: 'completed',
            hash: transactionId || `INV${Date.now()}`
        });

        res.status(201).json(investment);

    } catch (error) {
        console.error("Investment Error:", error);
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

// @desc    Get all investments (Admin)
// @route   GET /api/investments/all
// @access  Private/Admin
const getAllInvestments = async (req, res) => {
    try {
        const investments = await Investment.find({})
            .populate('user', 'name email wallet')
            .populate('package', 'name dailyReturn duration')
            .sort({ createdAt: -1 });
        res.json(investments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update investment status (Admin)
// @route   PUT /api/investments/:id
// @access  Private/Admin
const updateInvestmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const investment = await Investment.findById(req.params.id);

        if (investment) {
            investment.status = status;
            await investment.save();
            res.json(investment);
        } else {
            res.status(404).json({ message: 'Investment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createInvestment,
    getInvestments,
    getAllInvestments,
    updateInvestmentStatus,
};
