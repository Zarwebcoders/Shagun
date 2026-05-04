const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const ReferralIncome = require('../models/ReferralIncomes');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkChain = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const ids = ['SGN91105', 'SGN91106', 'SGN91133'];
        const users = {};

        for (const rid of ids) {
            const user = await User.findOne({ referral_id: rid });
            if (user) {
                users[rid] = user;
                console.log(`\n--- User: ${rid} (${user.full_name}) ---`);
                console.log(`Sponsor: ${user.sponsor_id}, Balance: ${user.sponsor_income}`);
                
                // Check products
                const products = await Product.find({ 
                    user_id: { $in: [user.id, user.user_id, user.referral_id, user._id.toString()] }
                });
                console.log(`Products: ${products.length}`);
                products.forEach(p => console.log(`- ${p.packag_type}, Status: ${p.approve}, Txn: ${p.transcation_id}`));

                // Check Referral Income RECEIVED by this user
                const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(id => id).map(id => String(id));
                const incomes = await ReferralIncome.find({ earner_user_id: { $in: queryIds } });
                console.log(`Referral Income Records Received: ${incomes.length}`);
                incomes.forEach(inc => console.log(`  - Amount: ${inc.referral_amount}, From: ${inc.referred_user_id}`));
            } else {
                console.log(`\nUser ${rid} NOT FOUND!`);
            }
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkChain();
