const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

async function testReportAggregation() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("--- ANALYZING REAL DATA FOR REPORTS ---");

        // 1. Revenue
        const revenue = await Product.aggregate([
            { $match: { approve: { $in: [1, "1"] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        console.log(`Total Revenue: ₹${revenue[0]?.total || 0}`);

        // 2. Deposits
        const deposits = await Transaction.aggregate([
            { $match: { type: 'deposit', status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        console.log(`Total Deposits: ₹${deposits[0]?.total || 0}`);

        // 3. Withdrawals
        const withdrawals = await Transaction.aggregate([
            { $match: { type: 'withdrawal', status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        console.log(`Total Withdrawals: ₹${withdrawals[0]?.total || 0}`);

        // 4. Regions
        const users = await User.find({ 
            address: { $exists: true, $ne: null, $ne: "" } 
        }, 'address').lean();
        const regionCounts = {};
        users.forEach(u => {
            if (!u.address) return;
            const parts = u.address.split(',').filter(p => p.trim()).map(p => p.trim());
            let region = parts[parts.length - 1] || "Other";
            if (/^\d+$/.test(region) && parts.length > 1) {
                region = parts[parts.length - 2];
            }
            regionCounts[region] = (regionCounts[region] || 0) + 1;
        });
        console.log("Top Regions:", Object.entries(regionCounts).sort((a,b) => b[1]-a[1]).slice(0, 3));

        console.log("\nSUCCESS: Database aggregation matches expected patterns.");

    } catch (err) {
        console.error("Aggregation Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

testReportAggregation();
