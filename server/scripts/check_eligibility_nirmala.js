const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const user = await User.findOne({ email: 'nirmalaben416@gmail.com' });
        console.log('User found:', user.email, '| id:', user.id, '| user_id:', user.user_id, '| _id:', user._id);

        const products = await Product.find({
            $or: [
                { user_id: user._id },
                { user_id: user.user_id },
                { user_id: user.id },
                { user_id: String(user._id) }
            ]
        });
        console.log(`Products found: ${products.length}`);

        if (products.length > 0) {
            console.log('Approval status:', products[0].approvel);
        } else {
            console.log('Maybe the user_id in Product is the old legacy string format e.g. SGNXXX?');
            // Try to find ANY product for this user using legacy string
            const prods2 = await Product.find({ user_id: { $regex: 'nirmala', $options: 'i' } });
            console.log('Products found via regex on email in user_id field:', prods2.length);
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
