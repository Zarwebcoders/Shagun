const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const LevelIncome = require('../models/LevelIncome');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        console.log(`Searching for transaction 1222333...`);

        // Find by transaction ID or w2 transcation
        const pObj = await mongoose.connection.db.collection('products').findOne({
            $or: [
                { transcation_id: '1222333' },
                { w2_transaction_id: '1222333' }
            ]
        });

        if (!pObj) {
            console.log("Product not found by transaction ID either.");

            // Just find ANY 110,000 products to see who owns them
            const any110k = await mongoose.connection.db.collection('products').find({ amount: 110000 }).toArray();
            console.log(`\nFound ${any110k.length} products total with amount 110,000:`);
            for (const p of any110k) {
                console.log(` - ID: ${p._id} | Owner: ${p.user_id} | Date: ${p.cereate_at} | trans: ${p.transcation_id}`);
            }
            return;
        }

        console.log(`Found Product! ID: ${pObj._id}`);
        console.log(`  Owner user_id field: ${pObj.user_id}`);
        console.log(`  Approved: ${pObj.approve} | Approvel: ${pObj.approvel}`);

        const count = await MonthlyTokenDistribution.countDocuments({ from_purchase_id: pObj._id });
        console.log(`  Monthly Distributions Generated: ${count}`);

        // See if user exists
        const u = await User.findOne({
            $or: [{ id: pObj.user_id }, { user_id: pObj.user_id }, { _id: pObj.user_id }, { user_id: 'SGN047' }]
        }).lean();

        if (u) {
            console.log(`  Mapped to User: ${u.full_name} (${u.user_id})`);
        } else {
            console.log(`  WARNING: user_id ${pObj.user_id} matches NO User.`);
        }

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
