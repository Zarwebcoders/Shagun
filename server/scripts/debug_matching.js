const mongoose = require('mongoose');
require('dotenv').config();

async function debugMatching() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        // Check Manoj specifically
        const user = await User.findOne({ user_id: 'SGN047' });
        console.log('User found:', user.full_name);
        console.log('User _id:', user._id, 'Type:', typeof user._id);
        console.log('User id:', user.id, 'Type:', typeof user.id);
        console.log('User user_id:', user.user_id, 'Type:', typeof user.user_id);
        console.log('User referral_id:', user.referral_id, 'Type:', typeof user.referral_id);

        const possibleIds = [
            user._id.toString(),
            user.user_id,
            user.id,
            user.referral_id
        ];
        console.log('Checking for possibleIds in Product.user_id:', possibleIds);

        // Find any products for this user
        const products = await Product.find({
            user_id: { $in: possibleIds }
        });

        console.log('Products found (ignoring approval):', products.length);
        if (products.length > 0) {
            products.forEach(p => {
                console.log(`- Product ID: ${p._id} | user_id in Product: "${p.user_id}" | Type: ${typeof p.user_id} | Approve: "${p.approve}"`);
            });
        }

        // Check if any product has user_id "47"
        const p47 = await Product.find({ user_id: "47" });
        console.log('Total products in DB with user_id "47":', p47.length);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugMatching();
