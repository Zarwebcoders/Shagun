const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const upline = await User.findOne({ email: 'beenakarve@gmail.com' });
        if (upline) {
            const dists = await MonthlyTokenDistribution.find({ user_id: upline._id })
                .populate('from_purchase_id')
                .populate('from_user_id')
                .sort({ scheduled_date: 1 });

            console.log('--- ALL RELEVANT DISTRIBUTIONS FOR beenakarve ---');
            dists.forEach(d => {
                const amt = Number(d.monthly_amount);
                // Check amounts close to 18.75 or 15.625
                if (Math.abs(amt - 18.75) < 0.1 || Math.abs(amt - 15.625) < 0.1) {
                    const buyerStr = d.from_user_id ? (d.from_user_id.email || d.from_user_id.user_id) : 'Unknown';
                    const prodStr = d.from_purchase_id ? `Pack: ${d.from_purchase_id.package} | Created: ${d.from_purchase_id.cereate_at || d.from_purchase_id.createdAt}` : 'Unknown';
                    console.log(`[ProdID: ${d.from_purchase_id ? d.from_purchase_id._id : 'null'}] -> ${prodStr} | Buyer: ${buyerStr} | Month: ${d.month_number} | Amount: ${d.monthly_amount} | Date: ${d.scheduled_date}`);
                }
            });
        }
    } catch (err) {
        console.log(err);
    } finally {
        mongoose.disconnect();
    }
});
