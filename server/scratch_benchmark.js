const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const ReferralIncomes = require('./models/ReferralIncomes');
const Product = require('./models/Product');
const MiningBonus = require('./models/MiningBonus');
const Wallet = require('./models/Wallet');
const MonthlyTokenDistribution = require('./models/MonthlyTokenDistribution');
const Withdrawal = require('./models/Withdrawal');
const Setting = require('./models/Setting');

async function runBenchmark() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const user = {
            _id: new mongoose.Types.ObjectId("69d4a8ed97d64f202a8951f8"),
            id: "4",
            user_id: "SGN004",
            referral_id: "SGN9004"
        };
        const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(Boolean);

        console.log("Starting queries benchmark for user SGN004...");

        // Query 1: Direct Team Count
        let start = Date.now();
        const directTeamCount = await User.countDocuments({ sponsor_id: user.referral_id });
        console.log(`1. Direct Team Count took: ${Date.now() - start} ms (count: ${directTeamCount})`);

        // Query 2: Referral Income Sum
        start = Date.now();
        const referralIncomes = await ReferralIncomes.aggregate([
            { $match: { earner_user_id: { $in: queryIds } } },
            { $group: { _id: null, total: { $sum: "$referral_amount" } } }
        ]);
        console.log(`2. Referral Income Sum took: ${Date.now() - start} ms`);

        // Query 3: Approved Product Check
        start = Date.now();
        const hasApprovedProduct = await Product.exists({
            user_id: { $in: queryIds },
            $or: [
                { approve: 1 },
                { approve: '1' }
            ]
        });
        console.log(`3. Approved Product Check took: ${Date.now() - start} ms (exists: ${!!hasApprovedProduct})`);

        // Query 4: Mining History
        start = Date.now();
        const wallet = await Wallet.findOne({ user_id: { $in: queryIds }, approve: 1 }).lean();
        const activeWalletAddress = wallet ? wallet.wallet_add : "N/A";
        const history = await MiningBonus.find({ 
            user_id: { $in: queryIds.concat([user.referral_id]) }
        }).sort({ created_at: -1 }).limit(20).lean();
        console.log(`4. Mining History took: ${Date.now() - start} ms (history count: ${history.length})`);

        // Query 5: Monthly Token Distribution
        start = Date.now();
        const distributions = await MonthlyTokenDistribution.find({ user_id: user._id }).lean();
        console.log(`5. Monthly Token Distribution took: ${Date.now() - start} ms (distributions count: ${distributions.length})`);

        // Query 6: Approved Withdrawals
        start = Date.now();
        const approvedWithdrawals = await Withdrawal.find({
            user_id: { $in: queryIds },
            approve: "1"
        }).lean();
        console.log(`6. Approved Withdrawals took: ${Date.now() - start} ms (withdrawals count: ${approvedWithdrawals.length})`);

        // Query 7: Settings
        start = Date.now();
        const settingsObj = await Setting.find({}).lean();
        console.log(`7. Settings took: ${Date.now() - start} ms`);

        await mongoose.disconnect();
        console.log("Benchmark complete.");
    } catch (err) {
        console.error(err);
    }
}

runBenchmark();
