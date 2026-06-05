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
        // Only return rates created manually (non-contract sync logs)
        const dbRates = await TokenRate.find({ source: { $ne: 'contract_getCurrentPhase' } }).sort({ created_at: -1 });

        const historicalRates = [
            {
                _id: 'hist_7',
                phase: 7,
                phase_number: null,
                rate: 12,
                source: 'Historical',
                date_display: 'Apr 21 2026 onwards',
                created_at: new Date('2026-04-21T00:00:00.000Z')
            },
            {
                _id: 'hist_6',
                phase: 6,
                phase_number: null,
                rate: 10,
                source: 'Historical',
                date_display: 'Mar 27 2026 – Apr 20 2026',
                created_at: new Date('2026-03-27T00:00:00.000Z')
            },
            {
                _id: 'hist_5',
                phase: 5,
                phase_number: null,
                rate: 8.3,
                source: 'Historical',
                date_display: 'Feb 28 2026 – Mar 26 2026',
                created_at: new Date('2026-02-28T00:00:00.000Z')
            },
            {
                _id: 'hist_4',
                phase: 4,
                phase_number: null,
                rate: 7,
                source: 'Historical',
                date_display: 'Jan 13 2026 – Feb 27 2026',
                created_at: new Date('2026-01-13T00:00:00.000Z')
            },
            {
                _id: 'hist_3',
                phase: 3,
                phase_number: null,
                rate: 5.8,
                source: 'Historical',
                date_display: 'Dec 27 2025 – Jan 12 2026',
                created_at: new Date('2025-12-27T00:00:00.000Z')
            },
            {
                _id: 'hist_2',
                phase: 2,
                phase_number: null,
                rate: 4.8,
                source: 'Historical',
                date_display: 'Dec 6 2025 – Dec 26 2025',
                created_at: new Date('2025-12-06T00:00:00.000Z')
            },
            {
                _id: 'hist_1',
                phase: 1,
                phase_number: null,
                rate: 4,
                source: 'Historical',
                date_display: 'Oct 1 2025 – Dec 5 2025',
                created_at: new Date('2025-10-01T00:00:00.000Z')
            }
        ];

        const combined = [...dbRates, ...historicalRates];
        
        // Sort by created_at descending
        combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.status(200).json(combined);
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
