const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const oldestProducts = await mongoose.connection.db.collection('products')
            .find({ approve: '1' })
            .sort({ cereate_at: 1 }) // Sort ascending by date
            .limit(10)
            .toArray();

        console.log(`--- Oldest 10 Approved Products ---`);
        for (const p of oldestProducts) {
            console.log(`ID: ${p._id}`);
            console.log(`  Amount: ₹${p.amount}`);
            console.log(`  Raw Date Value:`, p.cereate_at, `| Type:`, typeof p.cereate_at);
            if (p.cereate_at instanceof Date) {
                console.log(`  Locale String:`, p.cereate_at.toLocaleDateString(), p.cereate_at.toLocaleTimeString());
            } else {
                console.log(`  Parsed Date:`, new Date(p.cereate_at).toLocaleDateString());
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
});
