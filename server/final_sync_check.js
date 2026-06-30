const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');
const Distribution = require('./models/MonthlyTokenDistribution');

async function finalAudit() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
    const queryId = user.id || user.user_id;

    const incomes = await LevelIncome.find({ user_id: queryId, level: { $gt: 0 } });
    const dists = await Distribution.find({ user_id: user._id, level: { $gt: 0 } });

    console.log('--- FINAL SYNC CHECK ---');
    console.log('User model level_income:', user.level_income);
    console.log('Sum of LevelIncome records:', incomes.reduce((s,i) => s + i.amount, 0));
    console.log('Sum of ALL Distribution records (L1+):', dists.reduce((s,d) => s + d.monthly_amount, 0));
    
    const now = new Date();
    const matured = dists.filter(d => d.scheduled_date <= now);
    const maturedSum = matured.reduce((s,d) => s + d.monthly_amount, 0);
    console.log('Matured Dist Sum (Available):', maturedSum);
    console.log('Expected 1st installment (Total/24):', dists.reduce((s,d) => s + d.monthly_amount, 0) / 24);

    process.exit();
}

finalAudit();
