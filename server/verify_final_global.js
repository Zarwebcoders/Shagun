const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const verifyUser = async (email) => {
    const mainUser = await User.findOne({ email });
    if (!mainUser) {
        console.log(`User not found: ${email}`);
        return;
    }

    const mainId = mainUser.id || mainUser.user_id;
    console.log(`\n=============================`);
    console.log(`User: ${mainUser.full_name} (${mainUser.email}) | ID: ${mainId}`);
    console.log(`Level Income: ${mainUser.level_income?.toFixed(2)} | Total Income: ${mainUser.total_income?.toFixed(2)}`);

    const members = await User.find({
        sponsor_id: { $regex: new RegExp(`^${mainUser.referral_id}$`, 'i') }
    });

    console.log(`Level 1 Members: ${members.length}`);

    let hasZero = false;
    for (const m of members) {
        const incs = await LevelIncome.find({
            user_id: mainId,
            from_user_id: m.id,
            level: 1
        }).lean();

        const totalMonthly = incs.reduce((sum, i) => sum + i.amount / 12, 0);
        const status = incs.length === 0 ? '*** ZERO / MISSING ***' : `SGN ${totalMonthly.toFixed(3)}`;
        if (incs.length === 0) hasZero = true;
        console.log(`  - ${m.full_name} (${m.email}): ${status}`);
    }

    if (!hasZero) {
        console.log('==> All Level 1 members have non-zero income. PASS');
    } else {
        console.log('==> WARNING: Some Level 1 members still have zero income!');
    }
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Verify for the key users reported by the user
        await verifyUser('dilipgandhi25@gmail.com');

        // Also verify for blank@blank.com to ensure our previous fixes still hold
        await verifyUser('blank@blank.com');

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
