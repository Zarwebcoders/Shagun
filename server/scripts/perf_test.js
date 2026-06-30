const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const runDiagnostics = async () => {
    try {
        console.log("Connecting to MongoDB...");
        const startConn = Date.now();
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to MongoDB in ${Date.now() - startConn}ms`);

        const User = require('../models/User');
        const Product = require('../models/Product');
        const MiningBonus = require('../models/MiningBonus');
        const Wallet = require('../models/Wallet');
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
        const Withdrawal = require('../models/Withdrawal');
        const Setting = require('../models/Setting');

        // Pick test user
        const testUser = await User.findOne({ is_admin: { $nin: ["1", 1] } }).lean();
        if (!testUser) {
            console.error("No test user found!");
            process.exit(1);
        }

        console.log(`\nRunning parallel queries for user: ${testUser.email} (ID: ${testUser._id})`);

        const queryIds = [testUser.id, testUser.user_id, testUser.referral_id, testUser._id.toString()].filter(Boolean);

        const start = Date.now();

        const [
            directTeamCount,
            hasApprovedProduct,
            wallet,
            history,
            distributions,
            approvedWithdrawals,
            settings
        ] = await Promise.all([
            User.countDocuments({ sponsor_id: testUser.referral_id }),
            Product.exists({
                user_id: { $in: queryIds },
                $or: [{ approve: 1 }, { approve: '1' }]
            }),
            Wallet.findOne({ user_id: { $in: queryIds }, approve: 1 }).lean(),
            MiningBonus.find({ 
                user_id: { $in: queryIds.concat([testUser.referral_id]) }
            }).sort({ created_at: -1 }).limit(20).lean(),
            MonthlyTokenDistribution.find({ user_id: testUser._id }).lean(),
            Withdrawal.find({
                user_id: { $in: queryIds },
                approve: "1"
            }).lean(),
            Setting.find({}).lean()
        ]);

        const totalTime = Date.now() - start;
        console.log(`\nAll queries completed in parallel!`);
        console.log(`Total Parallel Query Execution Time: ${totalTime}ms`);
        console.log(`Individual items fetched:`);
        console.log(`- Direct Team Count: ${directTeamCount}`);
        console.log(`- Has Approved Product: ${!!hasApprovedProduct}`);
        console.log(`- Wallet: ${wallet ? wallet.wallet_add : 'N/A'}`);
        console.log(`- Mining History Count: ${history.length}`);
        console.log(`- Distributions Count: ${distributions.length}`);
        console.log(`- Withdrawals Count: ${approvedWithdrawals.length}`);
        console.log(`- Settings Count: ${settings.length}`);

        process.exit(0);
    } catch (error) {
        console.error("Diagnostics failed:", error);
        process.exit(1);
    }
};

runDiagnostics();
