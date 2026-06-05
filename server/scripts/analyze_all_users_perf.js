const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const runAnalysis = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const User = require('../models/User');
        const Product = require('../models/Product');
        const MiningBonus = require('../models/MiningBonus');
        const Wallet = require('../models/Wallet');
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
        const Withdrawal = require('../models/Withdrawal');

        // Let's get the 10 users with the most monthly distributions
        const topUsersDist = await MonthlyTokenDistribution.aggregate([
            { $group: { _id: "$user_id", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        console.log("\nTop 10 users by monthly token distributions count:");
        for (const item of topUsersDist) {
            const user = await User.findById(item._id).select('email referral_id');
            console.log(`- User: ${user?.email || 'N/A'} (Ref ID: ${user?.referral_id || 'N/A'}) | Count: ${item.count}`);
        }

        // Run detailed diagnostic on the top user
        if (topUsersDist.length > 0) {
            const slowUserId = topUsersDist[0]._id;
            const testUser = await User.findById(slowUserId).lean();
            
            console.log(`\n--- Running diagnostic for slow user: ${testUser.email} ---`);
            const queryIds = [testUser.id, testUser.user_id, testUser.referral_id, testUser._id.toString()].filter(Boolean);

            let start = Date.now();
            const directTeamCount = await User.countDocuments({ sponsor_id: testUser.referral_id });
            console.log(`1. countDocuments User: ${directTeamCount} in ${Date.now() - start}ms`);

            start = Date.now();
            const hasApprovedProduct = await Product.exists({
                user_id: { $in: queryIds },
                $or: [{ approve: 1 }, { approve: '1' }]
            });
            console.log(`2. exists Product: ${!!hasApprovedProduct} in ${Date.now() - start}ms`);

            start = Date.now();
            const wallet = await Wallet.findOne({ user_id: { $in: queryIds }, approve: 1 }).lean();
            console.log(`3. findOne Wallet: ${wallet ? 'Found' : 'Not Found'} in ${Date.now() - start}ms`);

            start = Date.now();
            const history = await MiningBonus.find({ 
                user_id: { $in: queryIds.concat([testUser.referral_id]) }
            }).sort({ created_at: -1 }).limit(20).lean();
            console.log(`4. find MiningBonus (limit 20): ${history.length} records in ${Date.now() - start}ms`);

            start = Date.now();
            const distributions = await MonthlyTokenDistribution.find({ user_id: testUser._id }).lean();
            console.log(`5. find MonthlyTokenDistribution: ${distributions.length} records in ${Date.now() - start}ms`);

            start = Date.now();
            const approvedWithdrawals = await Withdrawal.find({
                user_id: { $in: queryIds },
                approve: "1"
            }).lean();
            console.log(`6. find Withdrawal: ${approvedWithdrawals.length} records in ${Date.now() - start}ms`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Analysis failed:", error);
        process.exit(1);
    }
};

runAnalysis();
