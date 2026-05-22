const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const MonthlyTokenDistribution = require('./models/MonthlyTokenDistribution');

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
    if (!user) { console.log('User not found'); process.exit(1); }

    const now = new Date();
    const distributions = await MonthlyTokenDistribution.find({
        user_id: user._id,
        status: 'pending'
    });

    const totalLevelIncomeTotal = distributions.reduce((sum, d) => d.level > 0 ? sum + d.monthly_amount : sum, 0);
    const availableNow = distributions.reduce((sum, d) => {
        if (d.status === 'pending' && d.scheduled_date <= now && d.level > 0) {
            return sum + d.monthly_amount;
        }
        return sum;
    }, 0);

    const firstInstallment = distributions.find(d => d.level > 0);
    const installmentAmount = firstInstallment ? firstInstallment.monthly_amount : 0;
    const maturedCount = distributions.filter(d => d.status === 'pending' && d.scheduled_date <= now && d.level > 0).length;

    console.log(`\nVerification for ${user.email}:`);
    console.log(`- Total Contract Income (Sum of 24): ${totalLevelIncomeTotal.toFixed(3)}`);
    console.log(`- Per Installment (Total/24):        ${installmentAmount.toFixed(3)}`);
    console.log(`- Number of Matured installments:    ${maturedCount}`);
    console.log(`- Available for Withdrawal:        ${availableNow.toFixed(3)}`);
    
    console.log(`\nExample check: ${installmentAmount.toFixed(3)} * ${maturedCount} = ${(installmentAmount * maturedCount).toFixed(3)}`);
    
    process.exit(0);
};

run();
