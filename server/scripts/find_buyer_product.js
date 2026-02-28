const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const start = new Date('2025-11-19T00:00:00+05:30');
        const end = new Date('2025-11-20T00:00:00+05:30');

        const products = await Product.find({
            cereate_at: { $gte: start, $lt: end }
        }).populate('user_id');

        console.log(`Found ${products.length} products on 19 Nov 2025`);
        for (const p of products) {
            const u = p.user_id;
            const uid = u ? (u.user_id || u.id) : p.user_id;
            const unm = u ? u.full_name : 'Unknown';
            console.log(`\nProdID: ${p._id} | User: ${uid} - ${unm}`);

            // Check distributions for this product
            const dists = await MonthlyTokenDistribution.find({ from_purchase_id: p._id }).populate('user_id').sort({ level: 1 });
            console.log(`Distributions generated: ${dists.length}`);

            dists.slice(0, 5).forEach(d => {
                const rec = d.user_id ? d.user_id.email : d.user_id;
                console.log(`  -> Level: ${d.level} | Amt: ${d.monthly_amount} | Date: ${d.scheduled_date} | Rec: ${rec}`);
            });
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
