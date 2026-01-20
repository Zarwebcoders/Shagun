const TokenRate = require('../models/TokenRate');

// @desc    Add new token rate
// @route   POST /api/token-rate
// @access  Private/Admin
const addRate = async (req, res) => {
    const { phase, rate, phase_number, source } = req.body;

    if (phase === undefined || rate === undefined) {
        return res.status(400).json({ message: 'Please provide phase and rate' });
    }

    try {
        const newRate = await TokenRate.create({
            phase,
            rate,
            phase_number: phase_number || null,
            source: source || 'contract_getCurrentPhase'
        });

        res.status(201).json(newRate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all token rates (History)
// @route   GET /api/token-rate/all
// @access  Private/Admin
const getRates = async (req, res) => {
    try {
        const rates = await TokenRate.find({}).sort({ created_at: -1 });
        res.status(200).json(rates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get latest token rate
// @route   GET /api/token-rate/latest
// @access  Public
const getLatestRate = async (req, res) => {
    try {
        const latestRate = await TokenRate.findOne({}).sort({ created_at: -1 });
        if (!latestRate) {
            return res.status(404).json({ message: 'No rate found' });
        }
        res.status(200).json(latestRate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addRate, getRates, getLatestRate };
