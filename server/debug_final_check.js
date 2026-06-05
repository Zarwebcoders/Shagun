const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LevelIncome = require('./models/LevelIncome');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const blankUserId = "7";

        console.log('LevelIncome records for User ID:', blankUserId);
        const incomes = await LevelIncome.find({ user_id: blankUserId }).lean();

        console.log('\nINCOMES_FOUND:', incomes.length);
        for (const inc of incomes) {
            const fromUser = await User.findOne({ $or: [{ id: inc.from_user_id }, { user_id: inc.from_user_id }] });
            console.log(`- From: ${inc.from_user_id} (${fromUser ? fromUser.full_name : 'Unknown'}), Level: ${inc.level}, Amount: ${inc.amount}, Created: ${inc.created_at || inc.create_at}`);
        }

        const u = await User.findOne({ id: '7' });
        console.log('\nUser Info:', u.email, u.full_name, 'Created At:', u.create_at);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
