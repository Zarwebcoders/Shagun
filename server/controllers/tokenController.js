const Setting = require('../models/Setting');
const User = require('../models/User');
const TokenRate = require('../models/TokenRate');

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

        // Add a record to TokenRate history so it shows up in token rate history
        if (price !== undefined) {
            let phaseVal = 0;
            if (phase) {
                if (typeof phase === 'number') {
                    phaseVal = phase;
                } else if (typeof phase === 'string') {
                    const match = phase.match(/\d+/);
                    if (match) {
                        phaseVal = parseInt(match[0]);
                    }
                }
            }
            if (!phaseVal) phaseVal = 7; // Default to Phase 7 if not matching

            await TokenRate.create({
                phase: phaseVal,
                rate: price,
                phase_number: null,
                source: 'Admin Manual'
            });
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

// @desc    Get user's approved wallet address by email
// @route   GET /api/token/user-wallet
// @access  Private/Admin
const getUserWalletByEmail = async (req, res) => {
    const { email } = req.query;

    try {
        if (!email) {
            return res.status(400).json({ message: 'Email query parameter is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const Wallet = require('../models/Wallet');
        const wallet = await Wallet.findOne({
            user_id: { $in: [user._id.toString(), user.id, user.user_id].filter(Boolean) },
            approve: 1
        });

        if (!wallet || !wallet.wallet_add) {
            return res.status(400).json({ message: 'User has no approved wallet address linked' });
        }

        res.json({
            email: user.email,
            full_name: user.full_name,
            wallet_address: wallet.wallet_add,
            real_tokens: user.real_tokens
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Recover tokens from user account (Deduct amount)
// @route   POST /api/token/recover
// @access  Private/Admin
const recoverTokens = async (req, res) => {
    const { email, amount, onchain_tx_hash } = req.body; // Expecting email, amount, onchain_tx_hash

    try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const amountToRecover = parseFloat(amount);

        if (isNaN(amountToRecover) || amountToRecover <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        if (user.real_tokens < amountToRecover) {
            return res.status(400).json({ message: 'Insufficient token balance' });
        }

        // Deduct tokens
        user.real_tokens -= amountToRecover;
        await user.save();

        // Create transaction record
        const Transaction = require('../models/Transaction');
        await Transaction.create({
            user: user._id,
            type: 'withdrawal',
            amount: amountToRecover,
            hash: onchain_tx_hash || "",
            status: 'completed',
            description: `Token Recovery - Wallet Transfer: ${amountToRecover} REX`
        });

        res.json({
            message: `Successfully recovered ${amountToRecover} REX tokens from ${user.full_name}`,
            remainingBalance: user.real_tokens
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    updateTokenPrice,
    getTokenPrice,
    recoverTokens,
    getUserWalletByEmail
};
