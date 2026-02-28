const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const pObj = new mongoose.Types.ObjectId('699edb51092b0b5232819e03');
        const count = await MonthlyTokenDistribution.countDocuments({ from_purchase_id: pObj });

        console.log('Did the product generate MonthlyTokenDistributions?', count);

        const forceMatch = await mongoose.connection.db.collection('products').findOne({ _id: pObj });
        console.log('amount:', forceMatch.amount, 'approve:', forceMatch.approve, 'approvel:', forceMatch.approvel, 'user_id:', forceMatch.user_id, 'token_amount:', forceMatch.token_amount);
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
