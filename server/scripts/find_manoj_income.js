const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

async function findManojIncome() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Search for any LevelIncome records that result in exactly 2250/month (27000/year)
        // or a close value.
        const targetAmount = 2250 * 12; // 27000 tokens per year

        console.log('Searching for LevelIncome records with amount around 27000...');
        const incomes = await LevelIncome.find({
            amount: { $gte: targetAmount - 10, $lte: targetAmount + 10 }
        }).lean();

        console.log(`Found ${incomes.length} matching LevelIncome records.`);

        for (const inc of incomes) {
            const fromUser = await User.findOne({
                $or: [{ id: inc.from_user_id }, { user_id: inc.from_user_id }, { referral_id: inc.from_user_id }]
            });
            const recipient = await User.findOne({
                $or: [{ id: inc.user_id }, { user_id: inc.user_id }, { referral_id: inc.user_id }]
            });

            console.log(`--- Record ${inc._id} ---`);
            console.log(`From: ${fromUser ? fromUser.full_name : inc.from_user_id} (${fromUser ? fromUser.email : 'N/A'})`);
            console.log(`To: ${recipient ? recipient.full_name : inc.user_id} (${recipient ? recipient.email : 'N/A'})`);
            console.log(`Level: ${inc.level}, Amount: ${inc.amount} (Monthly: ${inc.amount / 12})`);

            if (fromUser && fromUser.email.includes('manoj')) {
                console.log('  >>> Matches Manoj Choure!');
                // Check if we should update this to 3.6%
                // Current amount is 27000. If this is 1.8%, then base was 27000 / 0.018 = 1,500,000.
                // If it should be 3.6%, new amount = 1,500,000 * 0.036 = 54,000.
                // Monthly would be 54000 / 12 = 4500.
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

findManojIncome();
