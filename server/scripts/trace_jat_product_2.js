const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const LevelIncome = require('../models/LevelIncome');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const targetProductId = "699edb51092b0b5232819e03"; // ₹660k purchase

        const incomes = await LevelIncome.find({
            from_product_id: targetProductId
        }).lean();

        console.log(`\n--- Level Incomes Generated from Product ${targetProductId} ---`);
        if (incomes.length === 0) {
            console.log("NO INCOMES FOUND for this product!");
        }

        for (const inc of incomes) {
            let receiver = await User.findOne({ $or: [{ id: inc.user_id }, { _id: inc.user_id }, { user_id: inc.user_id }] }).lean();
            let rName = receiver ? `${receiver.full_name} (${receiver.email})` : `ID: ${inc.user_id}`;
            let amountStr = Number(inc.amount).toFixed(2);

            console.log(`Level ${inc.level}: ${amountStr} -> deposited to ${rName}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
});
