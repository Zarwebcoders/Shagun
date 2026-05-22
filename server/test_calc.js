const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const User = require('./models/User');
        const LevelIncome = require('./models/LevelIncome');
        const getSum = async (query) => {
            const list = await LevelIncome.find(query);
            return list.reduce((s, x) => s + x.amount, 0);
        };

        const geetaId = '699edb91092b0b5232819eb9'; // SGN017 (Ripalkumar)
        const user = await User.findById(geetaId);

        const uidStr = user.id || user.user_id;

        const sumAll = await getSum({ user_id: uidStr });
        const sumGt0 = await getSum({ user_id: uidStr, level: { $gt: 0 } });

        console.log(`User.level_income in DB: ${user.level_income}`);
        console.log(`Sum of all LevelIncomes (annual): ${sumAll}`);
        console.log(`Sum of LevelIncomes > 0 (annual): ${sumGt0}`);
        console.log(`Monthly for Level > 0 (Level Income Breakdown total): ${sumGt0 / 12}`);

        process.exit(0);
    })
    .catch(console.error);
