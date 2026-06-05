const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB.");
    const now = new Date();

    // Find all pending distributions that are due (i.e. past scheduled_date)
    const pendingDistributions = await MonthlyTokenDistribution.find({
        status: 'pending',
        scheduled_date: { $lte: now }
    });

    console.log(`Found ${pendingDistributions.length} pending past distributions to unlock.`);

    let processedCount = 0;
    for (const dist of pendingDistributions) {
        try {
            const user = await User.findById(dist.user_id);
            if (user) {
                user.withdrawable_level_income = (user.withdrawable_level_income || 0) + dist.monthly_amount;
                dist.status = 'paid';
                dist.paid_date = new Date();

                await dist.save();
                await user.save();
                processedCount++;
            }
        } catch (err) {
            console.error("Error on dist", dist._id, err);
        }
    }
    console.log(`Successfully unlocked ${processedCount} distributions.`);
    process.exit(0);
});
