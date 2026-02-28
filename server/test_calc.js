const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const MonthlyTokenDistribution = require('./models/MonthlyTokenDistribution');
        const User = require('./models/User');

        const geetaId = '699edb91092b0b5232819eb9'; // SGN017
        const user = await User.findById(geetaId);

        const distributions = await MonthlyTokenDistribution.find({
            user_id: user._id,
            status: 'pending'
        });

        const monthlyAmounts = {};
        distributions.forEach(dist => {
            const key = `${dist.from_purchase_id}_${dist.level}`;
            if (!monthlyAmounts[key]) {
                monthlyAmounts[key] = dist.monthly_amount;
            }
        });

        const totalAnnual = Object.values(monthlyAmounts).reduce((sum, amount) => sum + (amount * 12), 0);
        const biMonthlyAmount = totalAnnual / 24;

        console.log(`totalAnnual: ${totalAnnual}`);
        console.log(`biMonthlyAmount: ${biMonthlyAmount}`);

        const lastWithdrawal = user.level_income_last_withdrawal;
        const withdrawnCount = user.level_income_withdrawn_count || 0;

        let canWithdraw = false;
        if (!lastWithdrawal) {
            canWithdraw = true;
        } else {
            const now = new Date();
            const daysSince = Math.floor((now - lastWithdrawal) / (1000 * 60 * 60 * 24));
            canWithdraw = daysSince >= 15 && withdrawnCount < 24;
            console.log(`Days since last withdrawal: ${daysSince}`);
        }

        const available = canWithdraw ? biMonthlyAmount : 0;
        console.log(`canWithdraw: ${canWithdraw}`);
        console.log(`Available: Math.round = ${Math.round(available * 100) / 100}`);

        process.exit(0);
    })
    .catch(console.error);
