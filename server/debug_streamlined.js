const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LevelIncome = require('./models/LevelIncome');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const incomes = await LevelIncome.find({ user_id: "7" }).lean();

        console.log('START_DATA');
        for (const inc of incomes) {
            console.log(`INC:${inc.from_user_id}:${inc.level}:${inc.amount}:${inc.created_at || inc.create_at}`);
        }
        console.log('END_DATA');
        process.exit();
    } catch (e) {
        process.exit(1);
    }
};

run();
