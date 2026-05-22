const mongoose = require('mongoose');
const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncomes');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const runGlobalAudit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const users = await User.find({ sponsor_income: { $gt: 0 } });
        console.log(`Auditing ${users.length} users with sponsor income...`);

        let missingBalanceCount = 0;

        for (const user of users) {
            const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(id => id).map(id => String(id));
            const incomes = await ReferralIncome.find({ earner_user_id: { $in: queryIds } });
            
            const calculatedTotal = incomes.reduce((acc, curr) => acc + Number(curr.referral_amount || 0), 0);
            
            if (calculatedTotal > user.sponsor_income + 1) { // +1 for floating point buffer
                console.log(`\n[MISSING] ${user.full_name} (${user.email} / ${user.referral_id})`);
                console.log(`  - Profile Balance: ₹${user.sponsor_income}`);
                console.log(`  - History Total:   ₹${calculatedTotal}`);
                console.log(`  - Missing Amount:  ₹${calculatedTotal - user.sponsor_income}`);
                
                // Optional: Fix it
                // const diff = calculatedTotal - user.sponsor_income;
                // user.sponsor_income = calculatedTotal;
                // user.total_income = (Number(user.total_income || 0)) + diff;
                // await user.save();
                // console.log(`  - FIXED!`);
                
                missingBalanceCount++;
            }
        }

        console.log(`\nGlobal Audit finished. Found ${missingBalanceCount} users with missing balance.`);
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

runGlobalAudit();
