const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
        console.log('User Properties -> id:', user.id, '| user_id:', user.user_id, '| _id:', user._id);

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
        console.log('User Eligible EXACT Mongoose?', !!hasPurchase);

        const testRaw = await mongoose.connection.db.collection('products').findOne({
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
        console.log('User Eligible BSON RAW Exact?', !!testRaw);

        const forceMatch = await mongoose.connection.db.collection('products').findOne({
            user_id: 'SGN008'
        });
        console.log('Force Match SGN008?', !!forceMatch);

        const forceMatch2 = await mongoose.connection.db.collection('products').findOne({
            user_id: 8
        });
        console.log('Force Match number 8?', !!forceMatch2);

        const checkType = await mongoose.connection.db.collection('products').findOne({
            _id: new mongoose.Types.ObjectId("699edb51092b0b5232819d99")
        });
        console.log('Dilip product 699edb51092b0b5232819d99 user_id type:', typeof checkType.user_id, 'value:', checkType.user_id);
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
