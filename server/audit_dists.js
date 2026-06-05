const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Distribution = require('./models/MonthlyTokenDistribution');

async function auditDists() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
    
    const dists = await Distribution.find({ user_id: user._id });
    console.log('--- DISTRIBUTION AUDIT ---');
    console.log('Total Dist Records:', dists.length);
    
    const totalAnnual = dists.reduce((s,d) => s + d.monthly_amount, 0);
    console.log('Total Annual Sum (Sum of monthly_amount * 1):', totalAnnual);
    
    const level1Sum = dists.filter(d => d.level === 1).reduce((s,d) => s + d.monthly_amount, 0);
    console.log('Level 1 Annual Sum:', level1Sum);
    console.log('Level 1 One Installment (Sum/24):', level1Sum / 24);

    const levels = [...new Set(dists.map(d => d.level))].sort((a,b)=>a-b);
    console.log('\nSums by Level:');
    levels.forEach(l => {
        const sum = dists.filter(d => d.level === l).reduce((s,d) => s + d.monthly_amount, 0);
        console.log(`Level ${l}: ${sum.toFixed(2)}`);
    });

    const now = new Date();
    const maturedLevel = dists.filter(d => d.level > 0 && d.scheduled_date <= now);
    console.log('\nMatured Level Income (Level > 0) Sum:', maturedLevel.reduce((s,d) => s + d.monthly_amount, 0));

    const maturedROI = dists.filter(d => d.level === 0 && d.scheduled_date <= now);
    console.log('Matured Mining Bonus (Level 0) Sum:', maturedROI.reduce((s,d) => s + d.monthly_amount, 0));

    process.exit();
}

auditDists().catch(console.error);
