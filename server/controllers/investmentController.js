const Investment = require('../models/Investment');
const User = require('../models/User');
const Package = require('../models/Package');
const Transaction = require('../models/Transaction');
const { validateAndResolveUserWallet } = require('../utils/walletValidation');

// @desc    Purchase a package (Create Investment)
// @route   POST /api/investments
// @access  Private
const createInvestment = async (req, res) => {
    let { packageId, amount, transactionId, sponsorId, paymentSlip, walletAddress } = req.body;

    try {
        // Validate and resolve wallet address (ensures 1 wallet = 1 account rule)
        const walletResult = await validateAndResolveUserWallet(req.user, walletAddress, true);
        if (!walletResult.valid) {
            return res.status(400).json({ message: walletResult.message });
        }
        const resolvedWalletAddress = walletResult.walletAddress;

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

        const normalizedTxnId = transactionId ? String(transactionId).trim() : '';
        if (normalizedTxnId) {
            const existingTxn = await Investment.findOne({ transactionId: normalizedTxnId });
            if (existingTxn) {
                return res.status(400).json({ message: 'An investment with this Transaction ID has already been submitted.' });
            }
        }

        // Prevent rapid double-clicks / multi-submissions within 5 seconds for the same user & package
        const recentDuplicate = await Investment.findOne({
            user: req.user.id,
            package: pkg._id,
            amount: Number(amount),
            createdAt: { $gte: new Date(Date.now() - 5000) }
        });
        if (recentDuplicate) {
            return res.status(429).json({ message: 'An investment request was just submitted. Please wait a moment.' });
        }

        // Calculate end date based on duration (days)
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (parseInt(pkg.duration) || 365));

        // Create Investment
        // Calculate Business Volume
        const businessVolume = (Number(amount) * (pkg.businessVolume || 100)) / 100;

        // Create Investment
        const investment = await Investment.create({
            user: req.user.id,
            package: pkg._id,
            amount: Number(amount),
            businessVolume: businessVolume,
            dailyReturn: pkg.dailyReturn,
            dailyReturnAmount: (Number(amount) * pkg.dailyReturn) / 100,
            startDate,
            endDate,
            transactionId: normalizedTxnId || `INV${Date.now()}`,
            status: 'pending', // Defaults to pending
            sponsorId: sponsorId || "",
            paymentSlip: paymentSlip || "",
            product: req.body.product || "",
            walletAddress: resolvedWalletAddress || ""
        });

        // Commission is NOT distributed here anymore. It will be distributed upon approval.

        // Create Transaction Record (Pending)
        await Transaction.create({
            user: req.user.id,
            type: 'investment',
            amount: Number(amount),
            description: `Investment in ${pkg.name} package (Pending Approval)`,
            status: 'pending',
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
            .populate('user', 'name email')
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
            const oldStatus = investment.status;
            investment.status = status;
            await investment.save();

            // If status changed to active, distribute commission and update transaction
            if (oldStatus !== 'active' && status === 'active') {
                console.log(`Approving investment ${investment._id}. BV: ${investment.businessVolume}`);
                const { distributeLevelIncome } = require('../utils/commission');
                // Use businessVolume for commission calculation, fallback to amount if BV is missing
                const calcAmount = investment.businessVolume !== undefined ? investment.businessVolume : investment.amount;
                await distributeLevelIncome(investment.user, calcAmount, investment.transactionId);

                // Update the original transaction status to completed
                const transaction = await Transaction.findOne({ hash: investment.transactionId });
                if (transaction) {
                    transaction.status = 'completed';
                    transaction.description = transaction.description.replace('(Pending Approval)', '');
                    await transaction.save();
                }
            } else if (status === 'rejected') {
                // Update the original transaction status to failed/rejected
                const transaction = await Transaction.findOne({ hash: investment.transactionId });
                if (transaction) {
                    transaction.status = 'failed';
                    await transaction.save();
                }
            }

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
