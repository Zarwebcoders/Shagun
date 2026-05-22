const mongoose = require('mongoose');
const Product = require('../models/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await Product.find({ quantity: { $gt: 1 } }).limit(5);
        console.log("Products with quantity > 1:");
        products.forEach(p => {
            console.log(`ID: ${p._id}, Amount: ${p.amount}, Qty: ${p.quantity}, Product: ${p.packag_type}`);
        });
        
        const single = await Product.findOne({ packag_type: /Milkish/i });
        if (single) {
            console.log("\nSample Milkish Product:");
            console.log(JSON.stringify(single, null, 2));
        }
        
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

check();
