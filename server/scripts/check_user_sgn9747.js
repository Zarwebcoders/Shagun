const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const ReferralIncome = require('../models/ReferralIncomes');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkUser = async (rid) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ referral_id: rid });
        
        if (!user) {
            console.log(`User ${rid} not found`);
            return;
        }

        console.log(`--- Status for ${rid} (${user.full_name}) ---`);
        console.log(`Email: ${user.email}`);
        console.log(`Sponsor ID: ${user.sponsor_id}`);
        console.log(`Sponsor Income: ₹${user.sponsor_income}`);
        console.log(`Level Income:   ₹${user.level_income}`);

        const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(id => id).map(id => String(id));
        
        const approvedProducts = await Product.find({
            user_id: { $in: queryIds },
            $or: [{ approve: 1 }, { approve: "1" }]
        });

        console.log(`Approved Products: ${approvedProducts.length}`);
        approvedProducts.forEach(p => {
            console.log(`  - ${p.packag_type}, Amount: ₹${p.amount}, Date: ${p.create_at}`);
        });

        if (approvedProducts.length > 0) {
            console.log(`RESULT: USER IS ACTIVE`);
        } else {
            console.log(`RESULT: USER IS INACTIVE`);
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkUser('SGN9734');
