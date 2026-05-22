const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const upline = await User.findOne({ email: 'beenakarve@gmail.com' });
        if (upline) {
            const sid1 = String(upline.user_id);
            const sid2 = String(upline.id);
            const oid = upline._id;

            console.log('User found:', upline.full_name, sid2, sid1, oid);

            const incomes = await LevelIncome.find({
                $or: [{ user_id: oid }, { user_id: sid1 }, { user_id: sid2 }, { user_id: String(oid) }]
            }).sort({ created_at: -1 }).limit(30);

            console.log(`--- TRANSACTIONS (${incomes.length} records) ---`);
            incomes.forEach(i => {
                const dt = i.created_at || i.create_at;
                console.log(`From: ${i.from_user_id} | Level: ${i.level} | Amount: ${i.amount} | Date: ${dt} | Cycle: ${i.cycle}`);
            });
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
