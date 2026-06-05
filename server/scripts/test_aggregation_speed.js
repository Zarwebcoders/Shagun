const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const runTest = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const targetUserId = new mongoose.Types.ObjectId('69d4a8ed97d64f202a8951f8');
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

        console.log(`\nRunning benchmark for user ID: ${targetUserId}`);

        // Method 1: Fetch all and reduce in memory (Old way)
        let start = Date.now();
        const distributions = await MonthlyTokenDistribution.find({ user_id: targetUserId }).lean();
        const now = new Date();
        const totalMaturedLevelOld = distributions.reduce((sum, dist) => {
            if (dist.scheduled_date <= now && dist.level > 0) return sum + dist.monthly_amount;
            return sum;
        }, 0);
        const totalMaturedMiningOld = distributions.reduce((sum, dist) => {
            if (dist.scheduled_date <= now && dist.level === 0) return sum + dist.monthly_amount;
            return sum;
        }, 0);
        console.log(`Method 1 (Old): ${distributions.length} records fetched. Level: ${totalMaturedLevelOld}, Mining: ${totalMaturedMiningOld} | Time: ${Date.now() - start}ms`);

        // Method 2: Aggregation in MongoDB (New way)
        start = Date.now();
        const maturedSummaries = await MonthlyTokenDistribution.aggregate([
            {
                $match: {
                    user_id: targetUserId,
                    scheduled_date: { $lte: now }
                }
            },
            {
                $group: {
                    _id: {
                        isLevel: { $gt: ["$level", 0] }
                    },
                    totalMatured: { $sum: "$monthly_amount" }
                }
            }
        ]);

        let totalMaturedLevelNew = 0;
        let totalMaturedMiningNew = 0;
        maturedSummaries.forEach(item => {
            if (item._id.isLevel) {
                totalMaturedLevelNew = item.totalMatured;
            } else {
                totalMaturedMiningNew = item.totalMatured;
            }
        });
        console.log(`Method 2 (New): Level: ${totalMaturedLevelNew}, Mining: ${totalMaturedMiningNew} | Time: ${Date.now() - start}ms`);

        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
};

runTest();
