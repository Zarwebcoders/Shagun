const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const pObjStr = '699edb51092b0b5232819d92'; // User 2, 12500
        const pObj = new mongoose.Types.ObjectId(pObjStr);

        const rawProduct = await mongoose.connection.db.collection('products').findOne({ _id: pObj });

        console.log(`Product 699edb51092b0b5232819d92: amount: ${rawProduct.amount}, approve: ${rawProduct.approve}, user_id: ${rawProduct.user_id}`);

        let u = null;
        if (mongoose.Types.ObjectId.isValid(rawProduct.user_id) && String(new mongoose.Types.ObjectId(rawProduct.user_id)) === String(rawProduct.user_id)) {
            u = await User.findById(rawProduct.user_id).lean();
        } else {
            u = await User.findOne({ $or: [{ id: rawProduct.user_id }, { user_id: rawProduct.user_id }] }).lean();
        }

        console.log(`Owner: ${u ? u.full_name + ' | Sponsor: ' + u.sponsor_id : 'NOT FOUND'}`);

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
