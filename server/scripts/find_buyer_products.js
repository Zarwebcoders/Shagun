const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const buyer = await User.findOne({ email: 'beenakarve@gmail.com' });
        console.log(`Buyer: ${buyer.full_name} | ID: ${buyer.user_id}`);

        const products = await Product.find({
            $or: [{ user_id: buyer._id }, { user_id: buyer.user_id }, { user_id: buyer.id }, { user_id: String(buyer._id) }]
        });

        console.log(`Products Found: ${products.length}`);

        for (const p of products) {
            console.log(`\nProduct ID: ${p._id} | Created: ${p.cereate_at} | Value: ${p.token_value}`);

            const dists = await MonthlyTokenDistribution.find({ from_purchase_id: p._id }).populate('user_id').sort({ level: 1 });
            console.log(`Total Distributions Generated: ${dists.length}`);

            // Show first 20 distributions
            dists.slice(0, 20).forEach(d => {
                const rec = d.user_id ? `${d.user_id.full_name} (${d.user_id.user_id})` : d.user_id;
                console.log(`  -> Lvl ${d.level} | Amt ${d.monthly_amount} | Date ${d.scheduled_date} | Rec: ${rec}`);
            });
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
