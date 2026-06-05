const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const targetEmail = 'dilipgandhi25@gmail.com';
        const mainUser = await User.findOne({ email: targetEmail });

        if (!mainUser) {
            console.log('Main user not found');
            process.exit(1);
        }

        console.log(`--- FINAL VERIFICATION FOR ${mainUser.full_name} (${mainUser.email}) ---`);

        const members = await User.find({
            sponsor_id: { $regex: new RegExp(`^${mainUser.referral_id}$`, 'i') }
        });

        console.log(`Checking ${members.length} Level 1 Members:\n`);

        for (const m of members) {
            const incs = await LevelIncome.find({
                user_id: mainUser.id,
                from_user_id: m.id,
                level: 1
            }).lean();

            console.log(`Member: ${m.full_name} (${m.email})`);
            console.log(`- Level 1 Incomes Found: ${incs.length}`);
            incs.forEach(inc => {
                console.log(`  * Amount: ₹${(inc.amount / 12).toFixed(2)} (Monthly) | Annual: ₹${inc.amount} | Product: ${inc.product_id}`);
            });
            console.log('-----------------------------------');
        }

        console.log(`\nFinal Balances for ${mainUser.full_name}:`);
        console.log(`- Level Income: ₹${mainUser.level_income.toFixed(2)}`);
        console.log(`- Total Income: ₹${mainUser.total_income.toFixed(2)}`);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
