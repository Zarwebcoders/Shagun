const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

async function finalFixManoj() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const manojEmail = 'choure.manoj69@gmail.com';
        const manoj = await User.findOne({ email: manojEmail });

        if (!manoj) {
            console.log('Manoj not found');
            return;
        }

        const manojIds = [manoj.id, manoj.user_id, manoj.referral_id].filter(id => id);

        // Find all Level 1 records from Manoj
        const incomes = await LevelIncome.find({
            from_user_id: { $in: manojIds },
            level: 1
        });

        console.log(`Found ${incomes.length} Level 1 records for Manoj.`);

        for (const inc of incomes) {
            const monthly = inc.amount / 12;
            console.log(`Checking Record ${inc._id}: Monthly ${monthly}`);

            // Double the income if it matches the 1.8% values (approx)
            if (Math.abs(monthly - 620.689655172414) < 1 || Math.abs(monthly - 2250) < 1) {
                console.log(`  Applying fix for record ${inc._id} (${monthly} -> ${monthly * 2})`);
                await applyFix(inc, monthly * 2);
            } else {
                console.log(`  Skipping record ${inc._id}, amount ${monthly} doesn't match expected 1.8% values.`);
            }
        }

        async function applyFix(inc, newMonthly) {
            const newAmount = newMonthly * 12;
            const oldAmount = inc.amount;
            const diff = newAmount - oldAmount;

            // 1. Update LevelIncome
            await LevelIncome.updateOne({ _id: inc._id }, { amount: newAmount });

            // 2. Update MonthlyTokenDistribution
            await MonthlyTokenDistribution.updateMany(
                { from_purchase_id: inc.product_id, user_id: inc.user_id, level: inc.level },
                { monthly_amount: newMonthly }
            );

            // 3. Update User Balance
            // Robust check for recipient user
            const recipient = await User.findOne({
                $or: [
                    { id: inc.user_id },
                    { user_id: inc.user_id },
                    { referral_id: inc.user_id }
                ]
            });

            if (recipient) {
                recipient.level_income = (recipient.level_income || 0) + diff;
                recipient.total_income = (recipient.total_income || 0) + diff;
                await recipient.save();
                console.log(`  [SUCCESS] Updated recipient ${recipient.full_name} (${recipient.user_id}) with +${diff} tokens`);
            } else {
                console.log(`  [ERROR] Recipient not found for ID: ${inc.user_id}`);
            }
        }

        console.log('Process complete.');
    } catch (err) {
        console.error('CRITICAL ERROR:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

finalFixManoj();
