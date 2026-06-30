const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');
const Distribution = require('./models/MonthlyTokenDistribution');

async function audit() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
    const queryId = user.id || user.user_id;

    console.log('--- AUDIT FOR DILIP GANDHI ---');
    console.log('User ID String:', queryId);
    console.log('User ObjectId:', user._id);

    const incomes = await LevelIncome.find({ user_id: queryId, level: { $gt: 0 } });
    console.log('Total LevelIncome records:', incomes.length);
    const sumIncomes = incomes.reduce((s, i) => s + i.amount, 0);
    console.log('Sum of LevelIncome amounts:', sumIncomes);

    const dists = await Distribution.find({ user_id: user._id, level: { $gt: 0 } });
    console.log('Total Distribution records (L1+):', dists.length);
    const sumDists = dists.reduce((s, d) => s + d.amount, 0); // Wait, field is amount or monthly_amount?
    // Check field name in Distribution model
    const sampleDist = await Distribution.findOne({ user_id: user._id });
    console.log('Sample Distribution structure:', JSON.stringify(sampleDist, null, 2));
    
    const sumDistsMonthly = dists.reduce((s, d) => s + (d.monthly_amount || 0), 0);
    const sumDistsAmount = dists.reduce((s, d) => s + (d.amount || 0), 0);
    console.log('Sum via monthly_amount:', sumDistsMonthly);
    console.log('Sum via amount:', sumDistsAmount);

    // Group by source product
    const incomeProducts = [...new Set(incomes.map(i => i.product_id?.toString()))];
    const distProducts = [...new Set(dists.map(d => d.from_purchase_id?.toString()))];
    
    console.log('Unique products in LevelIncome:', incomeProducts.length);
    console.log('Unique products in Distributions:', distProducts.length);

    // Find products that are in Distributions but NOT in LevelIncome
    const missingInIncome = distProducts.filter(p => !incomeProducts.includes(p));
    console.log('Products in Dists but missing in Incomes:', missingInIncome.length);

    process.exit();
}

audit();
