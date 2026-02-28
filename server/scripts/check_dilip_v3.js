const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });

        console.log('Checking raw conditions...');
        const coll = mongoose.connection.db.collection('products');

        console.log('1 ObjectId:', !!await coll.findOne({ user_id: user._id, approve: '1' }));
        console.log('2 user_id orig:', !!await coll.findOne({ user_id: user.user_id, approve: '1' }));
        console.log('3 raw id num:', !!await coll.findOne({ user_id: user.id, approve: '1' }));
        console.log('4 raw id string:', !!await coll.findOne({ user_id: String(user.id), approve: '1' }));
        console.log('5 String ObjectId:', !!await coll.findOne({ user_id: String(user._id), approve: '1' }));

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
