const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

async function fixManojIncome() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const targetAmount = 2250 * 12; // 27000 tokens per year

        // Find by amount first since IDs are tricky
        const incomes = await LevelIncome.find({
            amount: { $gte: targetAmount - 10, $lte: targetAmount + 10 }
        });

        console.log(`Found ${incomes.length} records matching the target amount.`);

        for (const inc of incomes) {
            console.log(`Checking record ${inc._id} from user ${inc.from_user_id}`);

            // Find the member who generated the income
            const fromUser = await User.findOne({
                $or: [
                    { id: inc.from_user_id },
                    { user_id: inc.from_user_id },
                    { referral_id: inc.from_user_id }
                ]
            });

            if (fromUser && fromUser.email.includes('manoj')) {
                console.log(`  >>> CONFIRMED: Manoj Choure found for record ${inc._id}`);

                const oldAmount = inc.amount;
                const newAmount = oldAmount * 2;
                const newMonthly = newAmount / 12;

                // 1. Update LevelIncome
                await LevelIncome.updateOne({ _id: inc._id }, { amount: newAmount });
                console.log(`  [UPDATE] LevelIncome ${inc._id}: ${oldAmount} -> ${newAmount}`);

                // 2. Update MonthlyTokenDistribution
                const distResults = await MonthlyTokenDistribution.updateMany(
                    { from_purchase_id: inc.product_id, user_id: inc.user_id, level: inc.level },
                    { monthly_amount: newMonthly }
                );
                console.log(`  [UPDATE] ${distResults.modifiedCount} distribution records updated to ${newMonthly} SGN/month`);

                // 3. Update User's level_income and total_income balance
                // Handle recipient ID (could be legacy string or ObjectId)
                let recipient;
                if (mongoose.Types.ObjectId.isValid(inc.user_id)) {
                    recipient = await User.findById(inc.user_id);
                }
                if (!recipient) {
                    recipient = await User.findOne({
                        $or: [{ id: inc.user_id }, { user_id: inc.user_id }, { referral_id: inc.user_id }]
                    });
                }

                if (recipient) {
                    const diff = newAmount - oldAmount;
                    recipient.level_income = (recipient.level_income || 0) + diff;
                    recipient.total_income = (recipient.total_income || 0) + diff;
                    await recipient.save();
                    console.log(`  [UPDATE] Recipient ${recipient.full_name} balance updated with +${diff} SGN`);
                } else {
                    console.log(`  [WARNING] Could not find recipient user for ID: ${inc.user_id}`);
                }
            } else {
                console.log('  Not Manoj Choure, skipping.');
            }
        }

        console.log('Fix script finished.');

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

fixManojIncome();
