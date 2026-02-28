const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const upline = await User.findOne({ email: 'beenakarve@gmail.com' });
        if (upline) {
            const dists = await MonthlyTokenDistribution.find({ user_id: upline._id, level: { $gt: 0 } })
                .populate('from_purchase_id')
                .populate('from_user_id')
                .sort({ scheduled_date: 1 });

            console.log(`Found ${dists.length} downline distributions for beenakarve@gmail.com`);

            dists.forEach(d => {
                const amt = Number(d.monthly_amount);
                const buyerStr = d.from_user_id ? d.from_user_id.full_name || d.from_user_id.user_id : 'Unknown';
                const pID = d.from_purchase_id ? d.from_purchase_id._id : 'N/A';
                const pDateStr = d.from_purchase_id ? d.from_purchase_id.cereate_at : 'Unknown';
                console.log(`Level: ${d.level} | Amount: ${amt.toFixed(4)} | Date: ${d.scheduled_date.toLocaleDateString()} | Buyer: ${buyerStr} | ProdDate: ${pDateStr}`);
            });
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
