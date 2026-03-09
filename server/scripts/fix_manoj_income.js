const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

async function fixManojIncome() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const targetAmount = 2250 * 12; // 27000 tokens per year

        const incomes = await LevelIncome.find({
            amount: { $gte: targetAmount - 10, $lte: targetAmount + 10 }
        });

        console.log(`Found ${incomes.length} records to fix.`);

        for (const inc of incomes) {
            const fromUser = await User.findOne({
                $or: [{ id: inc.from_user_id }, { user_id: inc.from_user_id }, { referral_id: inc.from_user_id }]
            });

            if (fromUser && fromUser.email.includes('manoj')) {
                console.log(`Updating record ${inc._id} for ${fromUser.full_name}`);

                // Old amount: 27000 (1.8%)
                // New amount: 54000 (3.6%)
                const oldAmount = inc.amount;
                const newAmount = oldAmount * 2;
                const newMonthly = newAmount / 12;

                // 1. Update LevelIncome
                await LevelIncome.updateOne({ _id: inc._id }, { amount: newAmount });
                console.log(`  LevelIncome ${inc._id} updated: ${oldAmount} -> ${newAmount}`);

                // 2. Update MonthlyTokenDistribution
                const distResults = await MonthlyTokenDistribution.updateMany(
                    { from_purchase_id: inc.product_id, user_id: inc.user_id, level: inc.level },
                    { monthly_amount: newMonthly }
                );
                console.log(`  ${distResults.modifiedCount} distribution records updated to ${newMonthly} SGN/month`);

                // 3. Update User's level_income and total_income balance
                const recipient = await User.findById(inc.user_id).catch(() => null) ||
                    await User.findOne({ id: inc.user_id }) ||
                    await User.findOne({ user_id: inc.user_id });

                if (recipient) {
                    const diff = newAmount - oldAmount;
                    recipient.level_income = (recipient.level_income || 0) + diff;
                    recipient.total_income = (recipient.total_income || 0) + diff;
                    await recipient.save();
                    console.log(`  Recipient ${recipient.full_name} balance updated with +${diff} SGN`);
                }
            }
        }

        console.log('Fix applied successfully.');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

fixManojIncome();
