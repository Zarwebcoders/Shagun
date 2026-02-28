const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const LevelIncome = require('../models/LevelIncome');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const count = await LevelIncome.countDocuments();
        console.log(`Total LevelIncome records in DB: ${count}`);

        const incomes = await LevelIncome.find().sort({ created_at: -1 }).limit(10);
        for (let i of incomes) {
            console.log(`User: ${i.user_id} | Level: ${i.level} | Amt: ${i.amount}`);
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
