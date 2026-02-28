const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

async function resetIncome() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected\n');

        // 1. Delete all distributions
        const delRes = await MonthlyTokenDistribution.deleteMany({});
        console.log(`Deleted ${delRes.deletedCount} MonthlyTokenDistributions.`);

        const LevelIncome = require('../models/LevelIncome');
        const delLiRes = await LevelIncome.deleteMany({});
        console.log(`Deleted ${delLiRes.deletedCount} old LevelIncome records.`);

        // 2. Reset level_income for all users
        const users = await User.find({ level_income: { $gt: 0 } });
        console.log(`Found ${users.length} users with level_income > 0.`);

        let resetCount = 0;
        for (const u of users) {
            console.log(`Resetting ${u.email}: level_income=${u.level_income}, withdrawable=${u.withdrawable_level_income}, total=${u.total_income}`);
            u.total_income = (u.total_income || 0) - u.level_income;
            if (u.total_income < 0) u.total_income = 0;
            u.level_income = 0;
            u.withdrawable_level_income = 0;
            await u.save();
            resetCount++;
        }

        console.log(`Reset ${resetCount} users successfully.`);

    } catch (err) {
        console.error("Reset failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

resetIncome();
