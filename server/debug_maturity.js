const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Distribution = require('./models/MonthlyTokenDistribution');

async function debugMaturity() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
    const now = new Date();

    const dists = await Distribution.find({ user_id: user._id, level: { $gt: 0 } });
    const matured = dists.filter(d => d.scheduled_date <= now);
    
    console.log('Total matured L1+ distributions:', matured.length);
    console.log('Total matured sum:', matured.reduce((s,d) => s + d.monthly_amount, 0));

    // Sort matured by amount descending
    const sorted = [...matured].sort((a,b) => b.monthly_amount - a.monthly_amount);
    console.log('Top 10 matured distributions:');
    sorted.slice(0, 10).forEach(d => {
        console.log(`Product: ${d.from_purchase_id}, Level: ${d.level}, Monthly: ${d.monthly_amount}, Date: ${d.scheduled_date}`);
    });

    process.exit();
}

debugMaturity();
