/**
 * SYSTEM-WIDE INCOME AUDIT
 * Checks every approved product in the DB and verifies that:
 * 1. The buyer has a Level 0 income record
 * 2. Every eligible upline (up to 25 levels) has a LevelIncome record
 * Reports any missing records as ISSUES.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const LEVEL_PERCENTAGES = [
    3.6, 1.8, 1.2, 0.96, 0.6, 0.6, 0.36, 0.36, 0.36,
    0.24, 0.24, 0.24, 0.24, 0.24, 0.12, 0.12, 0.12,
    0.12, 0.12, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06
];

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI, { socketTimeoutMS: 300000 });
    const db = mongoose.connection.db;

    const products = await db.collection('products').find({
        $or: [{ approve: 1 }, { approve: '1' }, { approvel: 1 }, { approvel: '1' }]
    }).toArray();

    console.log(`\nAUDITING ${products.length} APPROVED PRODUCTS...\n`);

    let totalIssues = 0;
    let checkedProducts = 0;
    const issueLog = [];

    for (const p of products) {
        // Find buyer
        const buyerClauses = [
            { id: p.user_id }, { user_id: p.user_id },
            { id: String(p.user_id) }, { user_id: String(p.user_id) }
        ];
        if (!isNaN(Number(p.user_id))) buyerClauses.push({ id: Number(p.user_id) });
        if (mongoose.Types.ObjectId.isValid(p.user_id)) {
            buyerClauses.push({ _id: new mongoose.Types.ObjectId(p.user_id) });
        }
        const buyer = await User.findOne({ $or: buyerClauses });

        if (!buyer) {
            issueLog.push(`[Tx:${p.transcation_id}] Buyer not found (user_id: ${p.user_id})`);
            totalIssues++;
            continue;
        }

        const buyerStrId = String(buyer.id || buyer.user_id);

        // Check Level 0 (self-ROI)
        const l0 = await LevelIncome.findOne({ user_id: buyerStrId, from_user_id: buyerStrId, product_id: p._id, level: 0 });
        if (!l0) {
            issueLog.push(`[Tx:${p.transcation_id}] MISSING Level 0 for buyer ${buyer.email}`);
            totalIssues++;
        }

        // Check uplines 1-25
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
            if (!sponsor) break;

            // Eligibility check (has purchase or tokens)
            const searchIds = [sponsor._id, String(sponsor._id), sponsor.id, sponsor.user_id, String(sponsor.id)].filter(Boolean);
            const hasPurchase = await db.collection('products').findOne({
                user_id: { $in: searchIds },
                $or: [{ approve: '1' }, { approve: 1 }, { approvel: '1' }, { approvel: 1 }]
            });
            const eligible = hasPurchase || (sponsor.shopping_tokens > 0) || (sponsor.airdrop_tokens > 0);

            if (eligible) {
                const sponsorStrId = String(sponsor.id || sponsor.user_id);
                const rec = await LevelIncome.findOne({
                    user_id: sponsorStrId, from_user_id: buyerStrId, product_id: p._id, level
                });
                if (!rec) {
                    issueLog.push(`[Tx:${p.transcation_id}] MISSING Level ${level} for ${sponsor.email} (upline of ${buyer.email})`);
                    totalIssues++;
                }
            }

            currentUser = sponsor;
        }

        checkedProducts++;
        if (checkedProducts % 50 === 0) {
            console.log(`Progress: ${checkedProducts}/${products.length} products checked | Issues so far: ${totalIssues}`);
        }
    }

    console.log('\n====== AUDIT COMPLETE ======');
    console.log(`Products Checked:  ${checkedProducts}`);
    console.log(`Total Issues Found: ${totalIssues}`);
    if (totalIssues === 0) {
        console.log('\n✅ ALL INCOME RECORDS ARE CORRECT. No missing records found!');
    } else {
        console.log('\n⚠️  ISSUES FOUND:');
        issueLog.forEach(issue => console.log('  - ' + issue));
    }

    process.exit(0);
};

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
