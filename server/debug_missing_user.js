const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');
const ReferralIncomes = require('./models/ReferralIncomes');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const mainUserEmail = 'blank@blank.com';
        const mainUser = await User.findOne({ email: mainUserEmail });

        if (!mainUser) {
            console.log(`User ${mainUserEmail} not found`);
            process.exit(1);
        }

        console.log(`\n--- Main User Info ---`);
        console.log(`Email: ${mainUser.email}`);
        console.log(`_id: ${mainUser._id}`);
        console.log(`id: ${mainUser.id}`);
        console.log(`user_id: ${mainUser.user_id}`);
        console.log(`referral_id: ${mainUser.referral_id}`);

        const queryId = mainUser.id || mainUser.user_id;
        console.log(`Query ID for level income: ${queryId}`);

        console.log(`\n--- Referrals Found in ReferralIncomes ---`);
        const referrals = await ReferralIncomes.find({ earner_user_id: queryId }).lean();
        console.log(`Total referral records: ${referrals.length}`);

        for (const ref of referrals) {
            const referredUser = await User.findOne({ $or: [{ id: ref.referred_user_id }, { user_id: ref.referred_user_id }] });
            console.log(`- Referred: ${ref.referred_user_id} (${referredUser ? referredUser.full_name : 'NOT FOUND'}), Amount: ${ref.amount}, Status: ${ref.status}`);
        }

        console.log(`\n--- Investigating SGN942 ---`);
        const sgn942 = await User.findOne({ $or: [{ id: 'SGN942' }, { user_id: 'SGN942' }, { referral_id: 'SGN942' }] });
        if (sgn942) {
            console.log(`SGN942 Found: ${sgn942.full_name}`);
            console.log(`- _id: ${sgn942._id}`);
            console.log(`- id: ${sgn942.id}`);
            console.log(`- user_id: ${sgn942.user_id}`);
            console.log(`- sponsor_id: ${sgn942.sponsor_id}`);
            console.log(`- Does sponsor match main user queryId (${queryId})? ${sgn942.sponsor_id === queryId}`);
        } else {
            console.log(`SGN942 NOT FOUND`);
        }

        console.log(`\n--- LevelIncome Records for Main User ---`);
        const incomeRecords = await LevelIncome.find({ user_id: queryId }).lean();
        console.log(`Total LevelIncome records: ${incomeRecords.length}`);
        for (const rec of incomeRecords) {
            const fromUser = await User.findOne({ $or: [{ id: rec.from_user_id }, { user_id: rec.from_user_id }] });
            console.log(`- From: ${rec.from_user_id} (${fromUser ? fromUser.full_name : 'NOT FOUND'}), Level: ${rec.level}, Amount: ${rec.amount}`);
        }

        console.log(`\n--- GraphLookup Simulation (Manual) ---`);
        const downline = await User.find({ sponsor_id: queryId }).select('id user_id full_name email sponsor_id').lean();
        console.log(`Direct downline (sponsor_id matches ${queryId}): ${downline.length}`);
        downline.forEach(u => {
            console.log(`- ${u.id || u.user_id} (${u.full_name})`);
        });

        console.log(`\n--- END DEBUG ---`);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
