const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        // Find users with 9007 in their user_id or id, or email with 9007
        const users = await User.find({
            $or: [
                { user_id: { $regex: '9007', $options: 'i' } },
                { id: { $regex: '9007', $options: 'i' } },
                { email: { $regex: '9007', $options: 'i' } }
            ]
        });

        console.log(`Found ${users.length} users matching '9007'`);
        for (const u of users) {
            console.log(`\nUser: ${u.full_name} | user_id: ${u.user_id} | id: ${u.id}`);
            const products = await Product.find({
                $or: [{ user_id: u._id }, { user_id: u.user_id }, { user_id: u.id }, { user_id: String(u._id) }]
            });
            console.log(`Products: ${products.length}`);
            products.forEach(p => {
                console.log(`  ProdID: ${p._id} | Date: ${p.cereate_at} | Value: ${p.token_value} | Approve: ${p.approve}`);

                // Also check distributions originating from this product
                MonthlyTokenDistribution.find({ from_purchase_id: p._id }).populate('user_id').sort({ level: 1 }).then(dists => {
                    console.log(`  -> Distributions generated: ${dists.length}`);
                    dists.slice(0, 3).forEach(d => {
                        console.log(`     Lvl: ${d.level} | Amt: ${d.monthly_amount} | Date: ${d.scheduled_date}`);
                    });
                });
            });
        }
    } catch (err) { console.log(err); } finally {
        setTimeout(() => mongoose.disconnect(), 2000);
    }
});
