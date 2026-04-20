const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');

async function checkDownline() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shagun';
        await mongoose.connect(mongoUri);
        
        const user = await User.findOne({ referral_id: 'SGN9282' });
        if (!user) {
            console.log("User SGN9282 not found");
            return;
        }

        console.log(`Checking downline for: ${user.email} (${user.referral_id})`);
        
        // Find everyone who has this user as sponsor (Level 1)
        const level1 = await User.find({ sponsor_id: user.referral_id });
        console.log(`Level 1 Count: ${level1.length}`);

        for (const u of level1) {
            const products = await Product.find({ user_id: { $in: [u._id, u.user_id, u.id] }, approve: 1 });
            if (products.length > 0) {
                console.log(`  User ${u.email} has ${products.length} approved products.`);
                for (const p of products) {
                    console.log(`    - Product: ${p._id} | Amount: ${p.amount}`);
                }
            } else {
                console.log(`  User ${u.email} has NO approved products.`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDownline();
