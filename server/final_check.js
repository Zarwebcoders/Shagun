const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LevelIncome = require('./models/LevelIncome');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await LevelIncome.countDocuments({ user_id: '7' });
        const sum = await LevelIncome.aggregate([
            { $match: { user_id: '7' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const user = await User.findOne({ email: 'blank@blank.com' });

        console.log('--- FINAL SYSTEM CHECK ---');
        console.log(`User Balance (level_income): ₹${user.level_income}`);
        console.log(`LevelIncome Records Count: ${count}`);
        console.log(`Sum of LevelIncome Records: ₹${sum[0] ? sum[0].total : 0}`);

        const details = await LevelIncome.find({ user_id: '7' }).lean();
        details.forEach(d => console.log(`- From: ${d.from_user_id} | Amount: ₹${d.amount} | Date: ${d.created_at || d.create_at}`));

        process.exit();
    } catch (e) {
        process.exit(1);
    }
};

run();
