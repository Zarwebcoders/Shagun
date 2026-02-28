const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const pObj = new mongoose.Types.ObjectId('699edb51092b0b5232819e03');
        const count = await MonthlyTokenDistribution.countDocuments({ from_purchase_id: pObj });

        console.log('Did the product generate MonthlyTokenDistributions?', count);

        const dists = await MonthlyTokenDistribution.find({ from_purchase_id: pObj }).lean();
        console.log(dists[0]);
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
