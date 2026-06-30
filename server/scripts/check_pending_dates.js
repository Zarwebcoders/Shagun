const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

async function checkPendingDates() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email: 'ripaldoshi48@gmail.com' }).lean();
        if (!user) return;

        const monthlyTokens = await MonthlyTokenDistribution.find({
            user_id: user._id,
            level: 0,
            status: 'pending'
        }).sort({ scheduled_date: 1 }).lean();

        console.log(`User: ${user.full_name}`);
        console.log(`Found ${monthlyTokens.length} pending L0 distributions:`);

        monthlyTokens.forEach((t, i) => {
            console.log(`${i + 1}. Amount: ${t.monthly_amount}, Date: ${t.scheduled_date}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkPendingDates();
