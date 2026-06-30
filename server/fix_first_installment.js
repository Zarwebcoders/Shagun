const mongoose = require('mongoose');
const User = require('./models/User');
const MonthlyTokenDistribution = require('./models/MonthlyTokenDistribution');
const dotenv = require('dotenv');
dotenv.config();

async function fixMaturity() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Target the specific user
        const user = await User.findOne({ email: 'testuser@gmail.com' });

        if (!user) {
            console.log('User testuser@gmail.com not found');
            return;
        }

        console.log(`Found user: ${user.email} (${user._id})`);

        // Find all month_number 1 distributions for this user that are level_income (>0)
        const distributions = await MonthlyTokenDistribution.find({
            user_id: user._id,
            month_number: 1,
            status: 'pending',
            level: { $gt: 0 }
        });

        console.log(`Found ${distributions.length} Level Income first-month pending installments.`);

        if (distributions.length > 0) {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 1); // Set to yesterday

            const result = await MonthlyTokenDistribution.updateMany(
                {
                    user_id: user._id,
                    month_number: 1,
                    status: 'pending',
                    level: { $gt: 0 }
                },
                {
                    $set: { scheduled_date: oldDate }
                }
            );

            console.log(`Updated ${result.modifiedCount} installments to be matured immediately.`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error fixing maturity:', err);
    }
}

fixMaturity();
