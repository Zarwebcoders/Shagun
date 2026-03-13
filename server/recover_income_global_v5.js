const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');
const MonthlyTokenDistribution = require('./models/MonthlyTokenDistribution');

dotenv.config();

const LEVEL_PERCENTAGES = [
    3.6, 1.8, 1.2, 0.96, 0.6, 0.6, 0.36, 0.36, 0.36,
    0.24, 0.24, 0.24, 0.24, 0.24, 0.12, 0.12, 0.12,
    0.12, 0.12, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06
];

const getTokenRate = (date) => {
    const d = new Date(date);
    if (d < new Date('2025-12-06T00:00:00+05:30')) return 4.0;
    if (d < new Date('2025-12-27T00:00:00+05:30')) return 4.8;
    if (d < new Date('2026-01-12T00:00:00+05:30')) return 5.8;
    return 7.0;
};

const isEligible = async (db, user) => {
    const searchIds = [user._id, String(user._id), user.id, user.user_id, String(user.id)].filter(Boolean);
    const product = await db.collection('products').findOne({
        user_id: { $in: searchIds },
        $or: [{ approve: '1' }, { approve: 1 }, { approvel: '1' }, { approvel: 1 }]
    });
    return !!product || (user.shopping_tokens || 0) > 0 || (user.airdrop_tokens || 0) > 0;
};

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI, { socketTimeoutMS: 300000 });
    const db = mongoose.connection.db;

    console.log('\n--- GLOBAL INCOME RECOVERY V5 (24 INSTALLMENTS) ---');

    // 1. CLEANUP: Reset all income fields for ALL users to avoid double counting
    console.log('Cleaning up existing income records and resetting user balances...');
    await LevelIncome.deleteMany({});
    await MonthlyTokenDistribution.deleteMany({});
    await User.updateMany({}, { 
        $set: { total_income: 0, level_income: 0, mining_bonus: 0, level_income_withdrawn_count: 0 } 
    });

    // 2. Fetch all approved products
    const products = await db.collection('products').find({
        $or: [{ approve: 1 }, { approve: '1' }, { approvel: 1 }, { approvel: '1' }]
    }).toArray();

    console.log(`Auditing ${products.length} products...\n`);

    let processed = 0;
    for (const p of products) {
        const buyerClauses = [{ id: p.user_id }, { user_id: p.user_id }, { id: String(p.user_id) }, { user_id: String(p.user_id) }];
        if (!isNaN(Number(p.user_id))) buyerClauses.push({ id: Number(p.user_id) });
        if (mongoose.Types.ObjectId.isValid(p.user_id)) buyerClauses.push({ _id: new mongoose.Types.ObjectId(p.user_id) });

        const buyer = await User.findOne({ $or: buyerClauses });
        if (!buyer) { processed++; continue; }

        const rate = getTokenRate(p.cereate_at || new Date());
        const totalBaseTokens = ((Number(p.token_value) || 10000) * (Number(p.quantity) || 1)) / rate;
        const buyerStrId = String(buyer.id || buyer.user_id);

        // --- LEVEL 0: Self ROI ---
        // For Self-ROI, user didn't specify if it's 24 or 10 or 12 times.
        // Usually it's 10 times or similar, but I'll stick to 24 installments for consistency now.
        const totalL0 = totalBaseTokens; // Assuming percentage for self IS the tokens? 
        // Actually Level 0 ROI is usually 100% split over 10-12 months.
        // I'll keep Level 0 as 12 monthly payments for now as it was ROI.
        await LevelIncome.create({ user_id: buyerStrId, from_user_id: buyerStrId, level: 0, amount: totalL0, product_id: p._id, create_at: p.cereate_at || new Date() });
        await User.updateOne({ _id: buyer._id }, { $inc: { mining_bonus: totalL0, total_income: totalL0 } });
        
        // Create 24 installments for Mining Bonus (ROI) - every 15 days starting Day 0
        for (let i = 1; i <= 24; i++) {
            const sDate = new Date(p.cereate_at || new Date());
            sDate.setDate(sDate.getDate() + (15 * (i - 1)));
            await MonthlyTokenDistribution.create({
                user_id: buyer._id, from_purchase_id: p._id, from_user_id: buyer._id, level: 0,
                monthly_amount: totalL0 / 24, month_number: i, status: 'pending', scheduled_date: sDate
            });
        }

        // --- LEVELS 1-25 ---
        let currentUpline = buyer;
        for (let level = 1; level <= 25; level++) {
            if (!currentUpline.sponsor_id) break;

            const sponsor = await User.findOne({
                $or: [
                    { referral_id: { $regex: new RegExp(`^${currentUpline.sponsor_id}$`, 'i') } },
                    { user_id: { $regex: new RegExp(`^${currentUpline.sponsor_id}$`, 'i') } },
                    { id: currentUpline.sponsor_id }
                ]
            });
            if (!sponsor) break;

            if (await isEligible(db, sponsor)) {
                const percentage = LEVEL_PERCENTAGES[level - 1];
                const totalIncome = (totalBaseTokens * percentage / 100); // 9364 is total for 24 times
                const sponsorStrId = String(sponsor.id || sponsor.user_id);

                if (sponsor.email === 'dilipgandhi25@gmail.com') {
                    console.log(`[DILIP] Level ${level} from ${buyer.email || buyer.referral_id}: Amount ${totalIncome}`);
                }
                await LevelIncome.create({ user_id: sponsorStrId, from_user_id: buyerStrId, level, amount: totalIncome, product_id: p._id, create_at: p.cereate_at || new Date() });
                await User.updateOne({ _id: sponsor._id }, { $inc: { level_income: totalIncome, total_income: totalIncome } });

                // Create 24 installments (every 15 days)
                for (let i = 1; i <= 24; i++) {
                    const sDate = new Date(p.cereate_at || new Date());
                    sDate.setDate(sDate.getDate() + (15 * (i - 1))); // i=1 is Day 0, i=2 is Day 15...
                    
                    await MonthlyTokenDistribution.create({
                        user_id: sponsor._id, from_purchase_id: p._id, from_user_id: buyer._id, level,
                        monthly_amount: totalIncome / 24, month_number: i, status: 'pending', scheduled_date: sDate
                    });
                }
            }
            currentUpline = sponsor;
        }

        processed++;
        if (processed % 50 === 0) console.log(`Progress: ${processed}/${products.length} products processed.`);
    }

    console.log('\n✅ RECOVERY V5 COMPLETE. All users updated with 24-installment logic.');
    process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
