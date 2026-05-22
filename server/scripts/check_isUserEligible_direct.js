const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });

        const hasPurchase = await Product.findOne({
            $and: [
                {
                    $or: [
                        { user_id: user._id },
                        { user_id: user.user_id },
                        { user_id: user.id },
                        { user_id: String(user._id) }
                    ]
                },
                { approve: 1 }
            ]
        });

        console.log('User Eligible?', !!hasPurchase);

        const test2 = await Product.findOne({ user_id: user.id, approve: 1 });
        console.log('Test 2?', !!test2);

        const test3 = await Product.findOne({ user_id: String(user.id), approve: 1 });
        console.log('Test 3 (String id)?', !!test3);

        const test4 = await Product.find({ approve: 1 }).limit(10);
        console.log('Test 4 (Any raw)?', test4.length);

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
