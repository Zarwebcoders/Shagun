const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const auditUser = async (refId) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Auditing User: ${refId}`);

        const user = await User.findOne({ referral_id: refId });
        if (!user) {
            console.log('User not found.');
            return;
        }

        console.log('--- User Info ---');
        console.log(`ID: ${user._id}`);
        console.log(`Name: ${user.full_name}`);
        console.log(`Referral ID: ${user.referral_id}`);
        console.log(`Sponsor ID: ${user.sponsor_id}`);
        console.log(`Total Income: ${user.total_income}`);
        console.log(`Sponsor Income: ${user.sponsor_income}`);
        console.log(`Level Income: ${user.level_income}`);

        // Find user products
        const userProducts = await Product.find({ user_id: user._id.toString() });
        console.log(`\n--- User's Own Products (${userProducts.length}) ---`);
        userProducts.forEach(p => {
            console.log(`- ${p.packag_type}, Amount: ${p.amount}, Approved: ${p.approve}`);
        });

        // Find direct referrals
        const directReferrals = await User.find({ sponsor_id: refId });
        console.log(`\n--- Direct Referrals (${directReferrals.length}) ---`);
        
        if (directReferrals.length > 0) {
            for (const ref of directReferrals) {
                // Check if this referral has purchased any product
                const purchases = await Product.find({ user_id: ref._id.toString(), approve: 1 });
                console.log(`- ${ref.full_name} (${ref.referral_id}): ${purchases.length} Approved Purchases`);
                purchases.forEach(p => {
                    console.log(`  * Product: ${p.packag_type}, Amount: ${p.amount}, Date: ${p.cereate_at}`);
                });
            }
        } else {
            console.log('No direct referrals found.');
        }

        // Check for Income records
        const Income = mongoose.model('Income', new mongoose.Schema({}, { strict: false }));
        const incomes = await Income.find({ user_id: user._id.toString() });
        console.log(`\n--- Income Records Found: ${incomes.length} ---`);
        incomes.forEach(inc => {
            console.log(`- Amount: ${inc.amount}, Type: ${inc.income_type}, Date: ${inc.createdAt || inc.cereate_at}`);
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

auditUser('SGN91131');
