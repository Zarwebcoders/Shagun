const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');
const Distribution = require('./models/MonthlyTokenDistribution');

async function debug() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
    if (!user) {
        console.log('User not found');
        return;
    }
    const queryId = user.id || user.user_id;
    const incomes = await LevelIncome.find({ user_id: queryId, level: { $gt: 0 } });
    const totalFromIncomes = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    const dists = await Distribution.find({ user_id: user._id });
    const totalLevelIncomeDists = dists.filter(d => d.level > 0).reduce((sum, d) => sum + d.amount, 0);

    console.log('User model level_income:', user.level_income);
    console.log('Sum of all LevelIncome records:', totalFromIncomes);
    console.log('Sum of all Distributions (L1+):', totalLevelIncomeDists);
    console.log('Installment size (L1+):', totalLevelIncomeDists / 24);

    // Grouping by level for clarity
    const levelBreakdown = incomes.reduce((acc, inc) => {
        acc[inc.level] = (acc[inc.level] || 0) + inc.amount;
        return acc;
    }, {});
    console.log('Level-wise breakdown from records:', levelBreakdown);

    process.exit();
}

debug();
