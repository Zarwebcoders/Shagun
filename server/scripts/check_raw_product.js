const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const prods = await Product.find().limit(5).lean();
        console.log(`Total ANY products in DB: ${await Product.countDocuments()}`);
        for (const p of prods) {
            console.log('Product keys:', Object.keys(p).join(', '));
            console.log('Approve value:', p.approve, ' | Approvel:', p.approvel);
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
