const ContractUpdateQueue = require('../models/ContractUpdateQueue');

// @desc    Get All Queue Items (Admin)
// @route   GET /api/contract-queue
// @access  Private/Admin
const getQueue = async (req, res) => {
    try {
        const queue = await ContractUpdateQueue.find({}).sort({ created_at: -1 });
        res.json(queue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add to Queue (Admin)
// @route   POST /api/contract-queue
// @access  Private/Admin
const addToQueue = async (req, res) => {
    const { rate, phase, target_contract } = req.body;
    try {
        const item = await ContractUpdateQueue.create({
            rate,
            phase,
            target_contract,
            status: 'queued',
            created_at: new Date(),
            updated_at: new Date()
        });
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Queue Item Status (Admin)
// @route   PUT /api/contract-queue/:id
// @access  Private/Admin
const updateQueueItem = async (req, res) => {
    const { status, tx_hash, output } = req.body;
    try {
        const item = await ContractUpdateQueue.findById(req.params.id);
        if (item) {
            item.status = status || item.status;
            item.tx_hash = tx_hash || item.tx_hash;
            item.output = output || item.output;
            item.updated_at = new Date();

            await item.save();
            res.json(item);
        } else {
            res.status(404).json({ message: 'Queue item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getQueue,
    addToQueue,
    updateQueueItem
};
