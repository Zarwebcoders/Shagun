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
    if (product) return true;
    if ((user.shopping_tokens || 0) > 0 || (user.airdrop_tokens || 0) > 0) return true;
    return false;
};

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI, {
        socketTimeoutMS: 300000,    // 5 min
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000
    });
};

const run = async () => {
    await connectDB();
    const db = mongoose.connection.db;

    console.log('--- TARGETED INCOME RECOVERY STARTED ---');

    // Fetch all approved products
    const products = await db.collection('products').find({
        $or: [{ approve: 1 }, { approve: '1' }, { approvel: 1 }, { approvel: '1' }]
    }).toArray();

    console.log(`Total Approved Products: ${products.length}`);

    let processed = 0, skipped = 0, newRecords = 0;

    for (let i = 0; i < products.length; i++) {
        const p = products[i];

        // Build buyer search
        const buyerClauses = [
            { id: p.user_id },
            { user_id: p.user_id },
            { id: String(p.user_id) },
            { user_id: String(p.user_id) }
        ];
        if (!isNaN(Number(p.user_id))) buyerClauses.push({ id: Number(p.user_id) });
        if (mongoose.Types.ObjectId.isValid(p.user_id)) {
            buyerClauses.push({ _id: new mongoose.Types.ObjectId(p.user_id) });
        }

        const buyer = await User.findOne({ $or: buyerClauses });
        if (!buyer) {
            console.log(`[${i + 1}/${products.length}] Buyer not found (user_id: ${p.user_id}). Skipping.`);
            skipped++;
            continue;
        }

        const rate = getTokenRate(p.cereate_at || new Date());
        const val = Number(p.token_value) || 10000;
        const qty = Number(p.quantity) || 1;
        const totalBaseTokens = (val * qty) / rate;
        const buyerStrId = String(buyer.id || buyer.user_id);

        // --- LEVEL 0: BUYER SELF-ROI ---
        const existingL0 = await LevelIncome.findOne({
            user_id: buyerStrId, from_user_id: buyerStrId, product_id: p._id, level: 0
        });
        if (!existingL0) {
            await LevelIncome.create({
                user_id: buyerStrId, from_user_id: buyerStrId, level: 0,
                amount: totalBaseTokens, product_id: p._id,
                create_at: p.cereate_at || new Date()
            });
            await User.updateOne({ _id: buyer._id }, {
                $inc: { level_income: totalBaseTokens, total_income: totalBaseTokens }
            });
            for (let m = 1; m <= 12; m++) {
                const sDate = new Date(p.cereate_at || new Date());
                sDate.setMonth(sDate.getMonth() + m);
                await MonthlyTokenDistribution.findOneAndUpdate(
                    { user_id: buyer._id, from_purchase_id: p._id, level: 0, month_number: m },
                    {
                        user_id: buyer._id, from_purchase_id: p._id, from_user_id: buyer._id, level: 0,
                        monthly_amount: totalBaseTokens / 12, month_number: m, status: 'pending', scheduled_date: sDate
                    },
                    { upsert: true }
                );
            }
            newRecords++;
        }

        // --- LEVELS 1-25 ---
        let currentUser = buyer;
        for (let level = 1; level <= 25; level++) {
            if (!currentUser.sponsor_id) break;

            const sponsor = await User.findOne({
                $or: [
                    { referral_id: { $regex: new RegExp(`^${currentUser.sponsor_id}$`, 'i') } },
                    { user_id: { $regex: new RegExp(`^${currentUser.sponsor_id}$`, 'i') } },
                    { id: currentUser.sponsor_id }
                ]
            });

            if (!sponsor) {
                console.log(`  [Tx:${p.transcation_id}] L${level}: Sponsor ${currentUser.sponsor_id} not found.`);
                break;
            }

            const eligible = await isEligible(db, sponsor);
            if (!eligible) {
                currentUser = sponsor;
                continue;
            }

            const percentage = LEVEL_PERCENTAGES[level - 1];
            const annualIncome = (totalBaseTokens * percentage / 100) * 12;
            const monthlyIncome = annualIncome / 12;
            const sponsorStrId = String(sponsor.id || sponsor.user_id);

            const existingRec = await LevelIncome.findOne({
                user_id: sponsorStrId, from_user_id: buyerStrId, product_id: p._id, level
            });

            if (!existingRec) {
                console.log(`  [Tx:${p.transcation_id}] L${level}: Crediting ${sponsor.email} => ${annualIncome.toFixed(2)} annual`);
                await LevelIncome.create({
                    user_id: sponsorStrId, from_user_id: buyerStrId, level,
                    amount: annualIncome, product_id: p._id,
                    create_at: p.cereate_at || new Date()
                });
                await User.updateOne({ _id: sponsor._id }, {
                    $inc: { level_income: annualIncome, total_income: annualIncome }
                });
                for (let m = 1; m <= 12; m++) {
                    const sDate = new Date(p.cereate_at || new Date());
                    sDate.setMonth(sDate.getMonth() + m);
                    await MonthlyTokenDistribution.findOneAndUpdate(
                        { user_id: sponsor._id, from_purchase_id: p._id, level, month_number: m },
                        {
                            user_id: sponsor._id, from_purchase_id: p._id, from_user_id: buyer._id,
                            level, monthly_amount: monthlyIncome, month_number: m,
                            status: 'pending', scheduled_date: sDate
                        },
                        { upsert: true }
                    );
                }
                newRecords++;
            } else if (Math.abs(existingRec.amount - annualIncome) > 0.01) {
                const diff = annualIncome - existingRec.amount;
                console.log(`  [Tx:${p.transcation_id}] L${level}: Correcting ${sponsor.email}: diff ${diff.toFixed(2)}`);
                await LevelIncome.updateOne({ _id: existingRec._id }, { $set: { amount: annualIncome } });
                await User.updateOne({ _id: sponsor._id }, {
                    $inc: { level_income: diff, total_income: diff }
                });
                await MonthlyTokenDistribution.updateMany(
                    { user_id: sponsor._id, from_purchase_id: p._id, level },
                    { $set: { monthly_amount: monthlyIncome } }
                );
            }

            currentUser = sponsor;
        }

        processed++;
        if (processed % 20 === 0) {
            console.log(`--- Progress: ${processed} / ${products.length} products processed ---`);
        }
    }

    console.log('\n--- TARGETED INCOME RECOVERY COMPLETED ---');
    console.log(`Processed: ${processed} | Skipped: ${skipped} | New/Corrected Records: ${newRecords}`);
    process.exit(0);
};

run().catch(err => {
    console.error('Fatal Error:', err.message);
    process.exit(1);
});
