const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');

async function debugProducts() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shagun';
        await mongoose.connect(mongoUri);
        
        const user = await User.findOne({ referral_id: 'SGN9282' });
        console.log(`Checking SGN9282 direct referrals...`);
        
        const level1 = await User.find({ sponsor_id: user.referral_id });

        for (const u of level1) {
            // Check ALL products, not just approved
            const products = await Product.find({ user_id: { $in: [u._id, u.user_id, u.id] } });
            if (products.length > 0) {
                console.log(`  User ${u.email} (${u.user_id}) has ${products.length} total products:`);
                for (const p of products) {
                    console.log(`    - ID: ${p._id} | Status: ${p.approve} | Amount: ${p.amount}`);
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugProducts();
