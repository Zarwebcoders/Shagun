require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
    // ── 6. Stats counts — global (unfiltered), handle mixed number/string types ─
    const [approvedCount, pendingCount, rejectedCount] = await Promise.all([
        Product.countDocuments({ approve: { $in: [1, '1'] } }),
        Product.countDocuments({ approve: { $in: [0, '0'] } }),
        Product.countDocuments({ approve: { $in: [2, '2'] } })
    ]);
    const totalAll = approvedCount + pendingCount + rejectedCount;

    console.log('Query result:');
    console.log({
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        total: totalAll
    });
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
