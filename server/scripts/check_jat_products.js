const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const user = await User.findOne({ email: 'jhdgjs@gmail.com' });
        console.log(`Jat Shankarlal Madhuji found. Sponsor ID: ${user.sponsor_id} | Referral: ${user.referral_id}`);

        const products = await mongoose.connection.db.collection('products').find({
            $or: [
                { user_id: String(user._id) },
                { user_id: user.user_id },
                { user_id: user.id },
                { user_id: String(user.id) }
            ]
        }).toArray();

        console.log(`\nFound ${products.length} Products for Jat Shankarlal:`);
        for (const p of products) {
            console.log(`- Product ID: ${p._id}`);
            console.log(`  Amount: ₹${p.amount}`);
            console.log(`  Created: ${new Date(p.cereate_at).toLocaleDateString()}`);
            console.log(`  Approved (Raw): '${p.approve}' | Approvel (Raw): '${p.approvel}'`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
});
