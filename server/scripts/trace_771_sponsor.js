const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const LevelIncome = require('../models/LevelIncome');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const u = await User.findOne({ user_id: "SGN771" }).lean();
        console.log(`User 771 is: ${u.full_name}, Sponsor: ${u.sponsor_id}`);

        let sponsor = await User.findOne({ $or: [{ user_id: u.sponsor_id }, { id: u.sponsor_id.toString() }, { id: u.sponsor_id.replace('SGN', '') }] });
        console.log(`Sponsor Details: ${sponsor ? sponsor.email + ' (' + sponsor.user_id + ')' : 'NOT FOUND'}`);

        console.log('\nTracing Level Incomes for product 699edb51092b0b5232819e03...');
        const pObj = "699edb51092b0b5232819e03"; // 660k product

        const incomes = await LevelIncome.find({ from_product_id: pObj }).lean();
        let total = 0;
        for (const inc of incomes) {
            let receiver = await User.findById(inc.user_id).lean();
            let amountStr = Number(inc.amount).toFixed(2);
            let rName = receiver ? `${receiver.full_name} (${receiver.user_id})` : `ID: ${inc.user_id}`;
            console.log(`Level ${inc.level}: ${amountStr} -> deposited to ${rName}`);
            total += inc.amount;
        }
        console.log(`Total Distributed: ${total}`);

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
