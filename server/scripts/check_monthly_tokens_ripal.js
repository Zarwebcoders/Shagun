const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const MiningBonus = require('../models/MiningBonus');

async function checkMonthlyTokens() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email: 'ripaldoshi48@gmail.com' }).lean();
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`User: ${user.full_name} (${user.email})`);
        console.log(`_id: ${user._id}`);
        console.log(`id: ${user.id}`);
        console.log(`user_id: ${user.user_id}`);

        // MonthlyTokenDistribution uses ObjectId
        const monthlyTokens = await MonthlyTokenDistribution.find({ user_id: user._id }).lean();
        console.log(`Found ${monthlyTokens.length} monthly token distributions for this user (by ObjectId).`);

        // MiningBonus uses String
        const miningBonuses = await MiningBonus.find({ user_id: { $in: [user.id, user.user_id, String(user._id)] } }).lean();
        console.log(`Found ${miningBonuses.length} mining bonus records for this user (by String).`);

        // Check if level 0 exists in monthly distributions
        const level0 = monthlyTokens.filter(t => t.level === 0);
        console.log(`Found ${level0.length} Level 0 (Self ROI) records.`);

        level0.forEach(t => {
            console.log(`- L0 Amount: ${t.monthly_amount}, Status: ${t.status}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkMonthlyTokens();
