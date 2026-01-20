const Migration = require('../models/Migration');

// @desc    Get All Migrations (Admin)
// @route   GET /api/migrations
// @access  Private/Admin
const getMigrations = async (req, res) => {
    try {
        const migrations = await Migration.find({}).sort({ time: -1 });
        res.json(migrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Migration Record (Manual/System)
// @route   POST /api/migrations
// @access  Private/Admin
const createMigration = async (req, res) => {
    const { version, class: className, group, namespace, time, batch } = req.body;
    try {
        const migration = await Migration.create({
            version,
            class: className,
            group,
            namespace,
            time: time || Math.floor(Date.now() / 1000), // Default to current unix timestamp if not provided
            batch: Number(batch)
        });
        res.status(201).json(migration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMigrations,
    createMigration
};
