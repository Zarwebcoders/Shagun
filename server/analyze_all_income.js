const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LevelIncome = require('./models/LevelIncome');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const mainUserId = '7'; // blank@blank.com

        const incomes = await LevelIncome.find({ user_id: mainUserId }).lean();
        console.log(`--- INCOME RECORDS FOR ID 7 (${incomes.length}) ---`);

        for (const inc of incomes) {
            const fromUser = await User.findOne({ $or: [{ id: inc.from_user_id }, { user_id: inc.from_user_id }] });
            console.log(`From: ${fromUser ? fromUser.full_name : inc.from_user_id} | Level: ${inc.level} | Amount: ${inc.amount} | ProductID: ${inc.product_id}`);
        }

        process.exit();
    } catch (e) {
        process.exit(1);
    }
};

run();
