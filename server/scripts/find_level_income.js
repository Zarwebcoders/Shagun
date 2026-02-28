const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const LevelIncome = require('../models/LevelIncome');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const incomes = await LevelIncome.find({
            amount: { $in: [18.75, 15.625] }
        }).limit(20);

        console.log(`Found ${incomes.length} records matching those amounts.`);
        for (const i of incomes) {
            const receiver = await User.findOne({
                $or: [{ id: i.user_id }, { user_id: i.user_id }]
            });
            const buyer = await User.findOne({
                $or: [{ id: i.from_user_id }, { user_id: i.from_user_id }]
            });

            console.log(`Amount: ${i.amount} | Date: ${i.created_at || i.create_at} | Receiver: ${receiver ? receiver.email : i.user_id} | Buyer: ${buyer ? buyer.full_name : i.from_user_id}`);
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
