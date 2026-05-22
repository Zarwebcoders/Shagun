const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const u = await User.findOne({ $or: [{ id: "771" }, { user_id: "771" }, { user_id: "SGN771" }] }).lean();
        console.log(`User 771 Detail:`, u ? `${u.full_name} (${u.email}) - Sponsor: ${u.sponsor_id}` : `NOT FOUND`);

        const pObj = new mongoose.Types.ObjectId('699edb51092b0b5232819e03');
        const dists = await MonthlyTokenDistribution.find({ from_purchase_id: pObj }).lean();
        console.log(`\nMonthly Distributions Found: ${dists.length}`);

        for (const [idx, d] of dists.entries()) {
            console.log(`[${idx}] For User ${d.user_id} - amount: ${d.token_amount} (dist_month: ${new Date(d.distribution_month).toLocaleDateString()})`);
        }

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
