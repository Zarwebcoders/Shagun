const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.set('debug', true);

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
                { approve: '1' }
            ]
        });
        console.log('User Eligible Mongoose:', !!hasPurchase);

        const test2 = await Product.findOne({
            user_id: user.id,
            approve: '1'
        });
        console.log('Simple query:', !!test2);

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
