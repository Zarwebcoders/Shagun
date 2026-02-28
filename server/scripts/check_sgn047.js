const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const u = await User.findOne({ user_id: 'SGN047' }).lean();
        console.log(`User SGN047 ID: ${u._id}`);

        // Find the 110,000 product purchased on 10/24/2025
        const pObj = await mongoose.connection.db.collection('products').findOne({
            user_id: { $in: [String(u._id), String(u.id), u.user_id, u.id] },
            amount: 110000
        });

        if (!pObj) {
            console.log("Could not find the 110000 product for this user!");
            return;
        }

        console.log(`Found Product: ${pObj._id} | Date: ${pObj.cereate_at}`);

        const distCount = await MonthlyTokenDistribution.countDocuments({ from_purchase_id: pObj._id });
        console.log(`Monthly Distributions: ${distCount}`);

        const incCount = await LevelIncome.countDocuments({ from_product_id: String(pObj._id), level: 0 });
        console.log(`Level 0 (Self ROI) Income Logs for this product: ${incCount}`);

        // Print all incomes FOR user 47 to see breakdown
        const allIncomes = await LevelIncome.find({ user_id: String(u._id) }).lean();
        let total = 0;
        console.log('\n--- Passbook for SGN047 ---');
        for (const i of allIncomes) {
            console.log(`Level ${i.level} | Amount: ${i.amount} | From Product: ${i.from_product_id} | Date: ${i.create_at}`);
            total += i.amount;
        }
        console.log(`Total Calculated: ${total}`);

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
