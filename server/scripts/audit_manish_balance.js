const mongoose = require('mongoose');
const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncomes');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const auditBalance = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found');
            return;
        }

        const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(id => id).map(id => String(id));
        const incomes = await ReferralIncome.find({ earner_user_id: { $in: queryIds } });
        
        const calculatedTotal = incomes.reduce((acc, curr) => acc + Number(curr.referral_amount || 0), 0);
        
        console.log(`--- Audit for ${user.full_name} (${email}) ---`);
        console.log(`Sponsor Income in Profile: ₹${user.sponsor_income}`);
        console.log(`Calculated Total from History: ₹${calculatedTotal}`);
        
        if (calculatedTotal > user.sponsor_income) {
            console.log(`[ALERT] Balance is MISSING! Difference: ₹${calculatedTotal - user.sponsor_income}`);
        } else if (calculatedTotal < user.sponsor_income) {
            console.log(`[NOTE] Balance is HIGHER than history (likely migration/extra).`);
        } else {
            console.log(`[OK] Balance matches history.`);
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

auditBalance('eklavya@gmail.com');
