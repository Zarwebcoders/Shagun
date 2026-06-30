const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const LEVEL_PERCENTAGES = [
    3.6, 1.8, 1.2, 0.96, 0.6, 0.6, 0.36, 0.36, 0.36, 0.24, 0.24, 0.24, 0.24, 0.24, 0.12, 0.12, 0.12, 0.12, 0.12, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06
];

const getTokenRate = (date) => {
    const d = new Date(date);
    const d6 = new Date('2025-12-06T00:00:00+05:30');
    const d27 = new Date('2025-12-27T00:00:00+05:30');
    const j12 = new Date('2026-01-12T00:00:00+05:30');

    if (d < d6) return 4.0;
    if (d < d27) return 4.8;
    if (d < j12) return 5.8;
    return 7.0;
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        // Target: blank@blank.com (SGN9007) and their network
        const mainUser = await User.findOne({ referral_id: { $regex: /^SGN9007$/i } });
        if (!mainUser) {
            console.error('Main user SGN9007 not found');
            process.exit(1);
        }

        console.log(`Starting recovery for network of ${mainUser.email} (${mainUser.id})`);

        // We'll focus on the Level 1 products since that's what we manually added and what the user complained about.
        // But let's make it generic for all products of their Level 1 members.

        const l1Members = await User.find({ sponsor_id: { $regex: /^SGN9007$/i } }).lean();
        console.log(`Found ${l1Members.length} Level 1 members.`);

        for (const m of l1Members) {
            const ps = await db.collection('products').find({
                user_id: { $in: [m._id, String(m._id), m.id, m.user_id, String(m.id)] },
                $or: [{ approve: 1 }, { approve: '1' }]
            }).toArray();

            for (const p of ps) {
                console.log(`\nProcessing Tx: ${p.transcation_id} from ${m.full_name}`);

                // 1. Calculate correct totalBaseTokens
                let totalBaseTokens = 0;
                if (p.token_amount && p.token_amount > 0) {
                    totalBaseTokens = Number(p.token_amount);
                } else {
                    const rate = getTokenRate(p.cereate_at);
                    const val = p.token_value || 10000;
                    const qty = p.quantity || 1;
                    totalBaseTokens = (val * qty) / rate;
                }

                // 2. We only care about distributing to the mainUser (Level 1) for now to fix the reported issue.
                // But let's check if a record ALREADY EXISTS.
                const existingRec = await LevelIncome.findOne({
                    user_id: mainUser.id,
                    from_user_id: m.id,
                    product_id: p._id
                });

                const monthlyPercentage = 3.6; // Level 1
                const totalAnnualTokens = (totalBaseTokens * monthlyPercentage / 100) * 12;

                if (existingRec) {
                    console.log(`Existing Record Found: Level ${existingRec.level}, Amount: ${existingRec.amount}`);
                    console.log(`Correct Amount should be: ${totalAnnualTokens}`);

                    if (Math.abs(existingRec.amount - totalAnnualTokens) > 0.01) {
                        const diff = totalAnnualTokens - existingRec.amount;
                        console.log(`Updating Record and Balance by diff: ${diff}`);

                        // Update Income Record
                        existingRec.amount = totalAnnualTokens;
                        await existingRec.save();

                        // Update User Balance
                        mainUser.level_income = (mainUser.level_income || 0) + diff;
                        mainUser.total_income = (mainUser.total_income || 0) + diff;
                        await mainUser.save();
                        console.log(`Balance Updated. New Level Income: ${mainUser.level_income}`);
                    } else {
                        console.log('Record is already correct.');
                    }
                } else {
                    console.log(`No record found. Creating new Level 1 record for ${totalAnnualTokens} tokens.`);

                    await LevelIncome.create({
                        user_id: mainUser.id,
                        from_user_id: m.id,
                        level: 1,
                        amount: totalAnnualTokens,
                        product_id: p._id,
                        create_at: p.cereate_at || new Date()
                    });

                    mainUser.level_income = (mainUser.level_income || 0) + totalAnnualTokens;
                    mainUser.total_income = (mainUser.total_income || 0) + totalAnnualTokens;
                    await mainUser.save();
                }
            }
        }

        console.log('\nRecovery V3 completed.');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
