const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const u = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
        console.log('User:', u?.email, '| id:', u?.id, '| user_id:', u?.user_id, '| _id:', u?._id);

        const products = await Product.find({
            $or: [
                { user_id: u._id },
                { user_id: u.user_id },
                { user_id: u.id },
                { user_id: String(u._id) }
            ]
        });
        console.log(`Products found: ${products.length}`);
        products.forEach(p => console.log(' -> _id:', p._id, ' | approve:', p.approve, ' | approvel:', p.approvel));
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
