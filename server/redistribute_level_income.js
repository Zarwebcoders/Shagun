/**
 * LEVEL INCOME REDISTRIBUTION SCRIPT
 * ------------------------------------
 * Logic:
 *   - For each APPROVED product, compute how many tokens the buyer received
 *     using the historical token rate at the time of purchase.
 *   - Then walk 25 levels up the sponsor chain.
 *   - For each upline at level L, credit:
 *       totalAnnualTokens = (buyerTokens * LEVEL_PERCENTAGES[L]) / 100
 *   - Split into 24 bi-monthly installments (every 15 days).
 *   - Installments whose scheduled_date <= today are marked 'paid' and
 *     added to withdrawable_level_income.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ─── Models ────────────────────────────────────────────────────────────────
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const LevelIncome = require('./models/LevelIncome');
const MonthlyTokenDistribution = require('./models/MonthlyTokenDistribution');

// ─── Constants ─────────────────────────────────────────────────────────────

/**
 * Historical token rates (₹ per token)
 * Phase 1: Oct 1  2025 – Dec 5  2025 → ₹4
 * Phase 2: Dec 6  2025 – Dec 26 2025 → ₹4.8
 * Phase 3: Dec 27 2025 – Jan 12 2026 → ₹5.8
 * Phase 4: Jan 13 2026 – Feb 27 2026 → ₹7
 * Phase 5: Feb 28 2026 – Mar 26 2026 → ₹8.30
 * Phase 6: Mar 27 2026 – Apr 20 2026 → ₹10
 * Phase 7: Apr 21 2026 onwards        → ₹12  (Current)
 */
const getHistoricalRate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 12.0;
    if (d >= new Date('2025-10-01') && d <= new Date('2025-12-05')) return 4.0;
    if (d >= new Date('2025-12-06') && d <= new Date('2025-12-26')) return 4.8;
    if (d >= new Date('2025-12-27') && d <= new Date('2026-01-12')) return 5.8;
    if (d >= new Date('2026-01-13') && d <= new Date('2026-02-27')) return 7.0;
    if (d >= new Date('2026-02-28') && d <= new Date('2026-03-26')) return 8.3;
    if (d >= new Date('2026-03-27') && d <= new Date('2026-04-20')) return 10.0;
    return 12.0; // Phase 7: Apr 21, 2026 onwards
};

/**
 * Token value for each product type (how many tokens the buyer gets)
 * product_id 1 (Milkish Herbal)  = 10,000 tokens
 * product_id 2 (Petro)           = 10,000 tokens
 * product_id 3 (Smart Home)      = 10,000 tokens
 * product_id 4 (Shagun EV)       = 20,000 tokens
 * Default (old packag_type names)= 10,000 tokens
 */
const getTokenValue = (product) => {
    if (product.token_value && Number(product.token_value) > 0) return Number(product.token_value);
    const map = { 1: 10000, 2: 10000, 3: 10000, 4: 20000 };
    if (product.product_id && map[product.product_id]) return map[product.product_id];
    // fallback by package name
    const pkg = (product.packag_type || '').toLowerCase();
    if (pkg.includes('ev')) return 20000;
    return 10000;
};

/**
 * 25-level percentage split (applied to buyer's tokens)
 */
const LEVEL_PERCENTAGES = [
    3.6,  // Level 1
    1.8,  // Level 2
    1.2,  // Level 3
    0.96, // Level 4
    0.6,  // Level 5
    0.6,  // Level 6
    0.36, // Level 7
    0.36, // Level 8
    0.36, // Level 9
    0.24, // Level 10
    0.24, // Level 11
    0.24, // Level 12
    0.24, // Level 13
    0.24, // Level 14
    0.12, // Level 15
    0.12, // Level 16
    0.12, // Level 17
    0.12, // Level 18
    0.12, // Level 19
    0.06, // Level 20
    0.06, // Level 21
    0.06, // Level 22
    0.06, // Level 23
    0.06, // Level 24
    0.06  // Level 25
];

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Find a user by any identifier (SGN ID, legacy numeric id, referral_id, ObjectId)
 * Normalises the id: strips whitespace & does case-insensitive match so that
 * "SGN9007", "sgn9007", "Sgn9007", "SGN 9007" all resolve to the same user.
 */
const findUser = async (id) => {
    if (!id) return null;

    // Strip all internal/external spaces, e.g. "SGN 9007" → "SGN9007"
    const raw = String(id).trim().replace(/\s+/g, '');

    // Try ObjectId first
    if (mongoose.Types.ObjectId.isValid(raw)) {
        const u = await User.findById(raw);
        if (u) return u;
    }

    // Case-insensitive regex match against all ID fields
    const regex = new RegExp(`^${raw}$`, 'i');
    return User.findOne({
        $or: [
            { user_id: regex },
            { id: raw },          // legacy id is usually numeric – exact match is fine
            { referral_id: regex }
        ]
    });
};

/**
 * Is this upline user eligible to receive level income?
 * Rules:
 *   1. Not deactivated (is_deleted === "0")
 *   2. Has at least one approved product purchase OR has tokens
 */
const isEligible = async (user) => {
    if (!user) return false;
    if (String(user.is_deleted) !== '0') return false;

    // Check for approved product purchase using raw driver to avoid cast issues
    const purchase = await mongoose.connection.db.collection('products').findOne({
        $and: [
            {
                $or: [
                    { user_id: user.user_id },
                    { user_id: user.id },
                    { user_id: String(user._id) }
                ]
            },
            { $or: [{ approve: 1 }, { approve: '1' }] }
        ]
    });
    if (purchase) return true;

    // Or has airdrop / shopping tokens
    if (Number(user.airdrop_tokons || 0) > 0 || Number(user.shopping_tokons || 0) > 0) return true;

    return false;
};

// ─── Main ──────────────────────────────────────────────────────────────────

const redistribute = async () => {
    await connectDB();

    try {
        console.log('\n🧹  Cleaning up previous LevelIncome records and level installments...');
        const delLevel = await LevelIncome.deleteMany({});
        const delDist = await MonthlyTokenDistribution.deleteMany({ level: { $gt: 0 } });
        console.log(`    Deleted ${delLevel.deletedCount} LevelIncome records.`);
        console.log(`    Deleted ${delDist.deletedCount} MonthlyTokenDistribution records.`);

        console.log('\n🧹  Resetting user level income balances...');
        const users = await User.find({ level_income: { $gt: 0 } });
        let userResetCount = 0;
        for (const user of users) {
            user.total_income = (Number(user.total_income) || 0) - (Number(user.level_income) || 0);
            if (user.total_income < 0) user.total_income = 0;

            user.level_income = 0;
            user.withdrawable_level_income = 0;
            user.level_income_last_withdrawal = null;
            user.level_income_withdrawn_count = 0;

            await user.save();
            userResetCount++;
        }
        console.log(`    Successfully reset balances for ${userResetCount} users.`);

        const now = new Date();

        // Fetch all approved products sorted by purchase date (oldest first)
        const products = await Product.find({
            $or: [{ approve: 1 }, { approve: '1' }]
        }).sort({ cereate_at: 1 });

        console.log(`\n✅  Found ${products.length} approved products. Starting redistribution...\n`);

        let productCount = 0;
        let totalLevelRecords = 0;
        let totalInstallments = 0;

        for (const product of products) {
            const purchaseDate = new Date(product.cereate_at || product.create_at || new Date());
            const rate = getHistoricalRate(purchaseDate);
            const tokenValue = getTokenValue(product);
            const qty = Number(product.quantity || 1);

            // Tokens the buyer received = tokenValue * qty / rate
            // e.g. 10000 tokens / rate 4 = 2500 tokens credited
            const buyerTokens = (tokenValue * qty) / rate;

            // Find the buyer
            const buyer = await findUser(product.user_id);
            if (!buyer) {
                console.warn(`  ⚠️  Buyer not found for product ${product._id} (user_id: ${product.user_id}). Skipping.`);
                continue;
            }

            const buyerStrId = String(buyer._id);

            const levelIncomeDocs = [];
            const installmentDocs = [];

            // Walk 25 levels up with Dynamic Compression
            let currentNode = buyer;
            let levelDistributed = 0;

            while (levelDistributed < 25) {
                if (!currentNode.sponsor_id) break;

                const upline = await findUser(currentNode.sponsor_id);
                if (!upline) break;

                // Removed eligibility check (dynamic compression) so deactivated users receive income
                // Income is distributed directly to this upline

                // Compute income for this level
                const pct = LEVEL_PERCENTAGES[levelDistributed];
                const totalAnnualTokens = (buyerTokens * pct) / 100;
                const installmentAmount = totalAnnualTokens / 24;

                // Update upline user balances
                upline.level_income = (Number(upline.level_income) || 0) + totalAnnualTokens;
                upline.total_income = (Number(upline.total_income) || 0) + totalAnnualTokens;

                // Mark already-due installments as paid and add to withdrawable
                let paidAmount = 0;
                for (let inst = 1; inst <= 24; inst++) {
                    const scheduledDate = new Date(purchaseDate);
                    scheduledDate.setDate(scheduledDate.getDate() + (inst - 1) * 15);
                    const status = scheduledDate <= now ? 'paid' : 'pending';
                    if (status === 'paid') paidAmount += installmentAmount;

                    installmentDocs.push({
                        user_id: upline._id,
                        from_purchase_id: product._id,
                        from_user_id: buyer._id,
                        level: levelDistributed + 1,
                        monthly_amount: installmentAmount,
                        month_number: inst,
                        status,
                        scheduled_date: scheduledDate
                    });
                }

                upline.withdrawable_level_income = (Number(upline.withdrawable_level_income) || 0) + paidAmount;

                await upline.save();

                // LevelIncome passbook record
                levelIncomeDocs.push({
                    user_id: String(upline._id),
                    from_user_id: buyerStrId,
                    level: levelDistributed + 1,
                    amount: totalAnnualTokens,
                    product_id: String(product._id),
                    create_at: purchaseDate
                });

                levelDistributed++;
                currentNode = upline;
            }

            // Bulk insert for this product
            if (levelIncomeDocs.length > 0) {
                await LevelIncome.insertMany(levelIncomeDocs);
                totalLevelRecords += levelIncomeDocs.length;
            }
            if (installmentDocs.length > 0) {
                await MonthlyTokenDistribution.insertMany(installmentDocs);
                totalInstallments += installmentDocs.length;
            }

            productCount++;
            console.log(`  ✔  Product ${productCount}/${products.length} | Buyer: ${buyer.user_id || buyer.id} (${buyer.full_name}) | Tokens: ${buyerTokens.toFixed(4)} | Rate: ₹${rate} | Levels distributed: ${levelDistributed}`);
        }

        console.log('\n══════════════════════════════════════════════════');
        console.log('  REDISTRIBUTION COMPLETE');
        console.log(`  Products processed   : ${productCount}`);
        console.log(`  LevelIncome records  : ${totalLevelRecords}`);
        console.log(`  Installment records  : ${totalInstallments}`);
        console.log('══════════════════════════════════════════════════\n');

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    } finally {
        mongoose.connection.close();
    }
};

redistribute();
