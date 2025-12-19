const Setting = require('../models/Setting');
const User = require('../models/User');

// @desc    Update token price and phase
// @route   POST /api/token/price
// @access  Private/Admin
const updateTokenPrice = async (req, res) => {
    const { price, phase } = req.body;

    try {
        if (price !== undefined) {
            await Setting.findOneAndUpdate(
                { key: 'rexTokenPrice' },
                { value: price },
                { upsert: true, new: true }
            );
        }

        if (phase !== undefined) {
            await Setting.findOneAndUpdate(
                { key: 'currentPhase' },
                { value: phase },
                { upsert: true, new: true }
            );
        }

        res.json({ message: 'Token price and phase updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current token price and phase
// @route   GET /api/token/price
// @access  Public
const getTokenPrice = async (req, res) => {
    try {
        const priceSetting = await Setting.findOne({ key: 'rexTokenPrice' });
        const phaseSetting = await Setting.findOne({ key: 'currentPhase' });

        res.json({
            price: priceSetting ? priceSetting.value : 0.1, // Default price
            phase: phaseSetting ? phaseSetting.value : 'Phase 1'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Recover tokens from lost account to new account
// @route   POST /api/token/recover
// @access  Private/Admin
const recoverTokens = async (req, res) => {
    const { oldUserIdentifier, newUserIdentifier } = req.body;

    try {
        // Find old user by email, name or wallet
        const oldUser = await User.findOne({
            $or: [
                { email: oldUserIdentifier },
                { wallet: oldUserIdentifier }
            ]
        });

        if (!oldUser) {
            return res.status(404).json({ message: 'Old user not found' });
        }

        // Find new user
        const newUser = await User.findOne({
            $or: [
                { email: newUserIdentifier },
                { wallet: newUserIdentifier }
            ]
        });

        if (!newUser) {
            return res.status(404).json({ message: 'New user not found' });
        }

        if (oldUser._id.equals(newUser._id)) {
            return res.status(400).json({ message: 'Old and new users are the same' });
        }

        // Transfer balances
        const amountToTransfer = oldUser.rexToken;
        const balanceToTransfer = oldUser.balance;

        newUser.rexToken += amountToTransfer;
        newUser.balance += balanceToTransfer;

        // Reset old user
        oldUser.rexToken = 0;
        oldUser.balance = 0;
        oldUser.status = 'suspended'; // Suspend lost account for security

        await newUser.save();
        await oldUser.save();

        res.json({
            message: `Successfully recovered ${amountToTransfer} REX and $${balanceToTransfer} from ${oldUser.email} to ${newUser.email}`,
            transferredTokens: amountToTransfer,
            transferredBalance: balanceToTransfer
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    updateTokenPrice,
    getTokenPrice,
    recoverTokens
};
