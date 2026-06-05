const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LevelIncome = require('./models/LevelIncome');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const p_id = '699edb51092b0b5232819e03'; // ID from screenshot

        console.log('--- ALL INCOMES FOR PRODUCT 6678 ---');
        const incomes = await LevelIncome.find({ product_id: p_id }).sort({ level: 1 }).lean();

        for (const inc of incomes) {
            const u = await User.findOne({ $or: [{ id: inc.user_id }, { user_id: inc.user_id }] });
            console.log(`Level ${inc.level}: User: ${u ? u.full_name : inc.user_id} | Amount: ${inc.amount}`);
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
