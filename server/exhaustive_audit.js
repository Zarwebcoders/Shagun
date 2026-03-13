const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');
const Distribution = require('./models/MonthlyTokenDistribution');

async function exhaustiveAudit() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
    const queryId = user.id || user.user_id;

    console.log('--- EXHAUSTIVE AUDIT FOR DILIP ---');
    console.log('User Email:', user.email);
    console.log('User ID String:', queryId);

    // 1. Check LevelIncome Sums per level
    const incomes = await LevelIncome.find({ user_id: queryId });
    const incomeByLevel = incomes.reduce((acc, inc) => {
        acc[inc.level] = (acc[inc.level] || 0) + inc.amount;
        return acc;
    }, {});
    console.log('\nLevelIncome Records Sum (by level):');
    Object.keys(incomeByLevel).sort((a,b)=>a-b).forEach(l => {
        console.log(`Level ${l}: ${incomeByLevel[l]}`);
    });
    console.log('Total Income Sum:', Object.values(incomeByLevel).reduce((s,a)=>s+a, 0));

    // 2. Check Distribution Sums per level
    const dists = await Distribution.find({ user_id: user._id });
    const distByLevel = dists.reduce((acc, d) => {
        if (!acc[d.level]) acc[d.level] = { sum: 0, count: 0 };
        acc[d.level].sum += d.monthly_amount;
        acc[d.level].count += 1;
        return acc;
    }, {});
    console.log('\nMonthlyTokenDistribution Sum (Full Annual, by level):');
    Object.keys(distByLevel).sort((a,b)=>a-b).forEach(l => {
        console.log(`Level ${l}: Sum=${distByLevel[l].sum}, Records=${distByLevel[l].count}`);
    });
    console.log('Total Distribution Sum:', Object.values(distByLevel).reduce((s,a)=>s+a.sum, 0));

    // 3. Comparison
    console.log('\nComparison of Full Annual Totals:');
    const allLevelsFiltered = [...new Set([...Object.keys(incomeByLevel), ...Object.keys(distByLevel)])].sort((a,b)=>a-b);
    allLevelsFiltered.forEach(l => {
        const inc = incomeByLevel[l] || 0;
        const dist = distByLevel[l]?.sum || 0;
        const diff = Math.abs(inc - dist);
        if (diff > 1) {
            console.log(`Level ${l}: IncomeRec=${inc.toFixed(2)}, DistTotal=${dist.toFixed(2)} !!! MISMATCH !!!`);
        } else {
            console.log(`Level ${l}: Match (~${inc.toFixed(2)})`);
        }
    });

    process.exit();
}

exhaustiveAudit().catch(console.error);
