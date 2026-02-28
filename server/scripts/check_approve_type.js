const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const prods = await Product.find().limit(5).lean();
        for (const p of prods) {
            console.log('approve typeof:', typeof p.approve, p.approve);
            console.log('approvel typeof:', typeof p.approvel, p.approvel);
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
