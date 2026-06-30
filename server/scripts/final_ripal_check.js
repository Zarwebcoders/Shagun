const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

async function finalExplanation() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email: 'ripaldoshi48@gmail.com' }).lean();
        if (!user) return;

        const monthlyTokens = await MonthlyTokenDistribution.find({
            user_id: user._id,
            level: 0,
            status: 'pending'
        }).sort({ scheduled_date: 1 }).lean();

        console.log(`Summary for Ripalkumar Doshi:`);
        console.log(`Current mining_bonus balance: ${user.mining_bonus}`);
        console.log(`Total Pending L0 (Self-ROI): ${monthlyTokens.length} records`);

        if (monthlyTokens.length > 0) {
            console.log(`Next Release: ${monthlyTokens[0].scheduled_date}`);
            console.log(`Second Release: ${monthlyTokens[1].scheduled_date}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

finalExplanation();
