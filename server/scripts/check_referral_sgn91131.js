const mongoose = require('mongoose');
const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncomes');
const Product = require('../models/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkReferral = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ referral_id: 'SGN91131' });
        
        if (!user) {
            console.log('User SGN91131 not found');
            return;
        }

        console.log('--- User Info ---');
        console.log(`Name: ${user.full_name}, ID: ${user.id}, _id: ${user._id}`);

        const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(id => id).map(id => String(id));
        console.log('Searching ReferralIncomes with earner_user_id in:', queryIds);

        const incomes = await ReferralIncome.find({ earner_user_id: { $in: queryIds } });
        console.log(`Found ${incomes.length} referral income records.`);

        incomes.forEach(inc => {
            console.log(`- Amount: ${inc.referral_amount}, Referred User ID: ${inc.referred_user_id}, Date: ${inc.create_at}`);
        });

        // Also check if SGN91132 has any products and their status
        const referral = await User.findOne({ referral_id: 'SGN91132' });
        if (referral) {
            console.log('\n--- Referral (SGN91132) Info ---');
            console.log(`Name: ${referral.full_name}, ID: ${referral.id}, _id: ${referral._id}`);
            const products = await Product.find({ user_id: referral._id.toString() });
            console.log(`Products found for SGN91132: ${products.length}`);
            products.forEach(p => {
                console.log(`- ${p.packag_type}, Status: ${p.approve}, Txn: ${p.transcation_id}`);
            });
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkReferral();
