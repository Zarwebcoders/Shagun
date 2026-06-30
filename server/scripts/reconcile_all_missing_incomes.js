const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const Withdrawal = require('../models/Withdrawal');
const { isUserEligible } = require('../utils/levelIncome25');

/**
 * Normalises the user ID for case-insensitive robust lookups
 */
const findUserRobustly = async (id) => {
    if (!id) return null;

    const raw = String(id).trim().replace(/\s+/g, '');

    if (mongoose.Types.ObjectId.isValid(raw)) {
        const user = await User.findById(raw);
        if (user) return user;
    }

    const regex = new RegExp(`^${raw}$`, 'i');
    return await User.findOne({
        $or: [
            { user_id: regex },
            { id: raw },
            { referral_id: regex }
        ]
    });
};

/**
 * Historical rate mapping based on purchase date
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
    return 12.0; // Apr 21, 2026 onwards
};

/**
 * Get product token value
 */
const getTokenValue = (product) => {
    if (product.token_value && Number(product.token_value) > 0) return Number(product.token_value);
    const map = { 1: 10000, 2: 10000, 3: 10000, 4: 20000 };
    if (product.product_id && map[product.product_id]) return map[product.product_id];
    const pkg = (product.packag_type || '').toLowerCase();
    if (pkg.includes('ev')) return 20000;
    return 10000;
};

const LEVEL_PERCENTAGES = [
    3.6, 1.8, 1.2, 0.96, 0.6, 0.6, 0.36, 0.36, 0.36,
    0.24, 0.24, 0.24, 0.24, 0.24, 0.12, 0.12, 0.12,
    0.12, 0.12, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06
];

async function run() {
    const isWriteMode = process.argv.includes('--write') || process.argv.includes('write');
    console.log(`=== RUNNING RECONCILIATION ===`);
    console.log(`Mode: ${isWriteMode ? 'WRITE (DB WILL BE UPDATED)' : 'DRY-RUN (NO CHANGES)'}\n`);

    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI is missing');
        await mongoose.connect(uri);
        console.log('Connected to MongoDB.');

        const products = await Product.find({
            $or: [{ approve: 1 }, { approve: '1' }]
        }).sort({ cereate_at: 1 });

        console.log(`Found ${products.length} approved products.`);

        const now = new Date();
        let levelIncomeCreated = 0;
        let distributionsCreated = 0;

        for (const product of products) {
            const purchaseDate = new Date(product.cereate_at || product.create_at || new Date());
            const rate = getHistoricalRate(purchaseDate);
            const tokenValue = getTokenValue(product);
            const qty = Number(product.quantity || 1);
            const buyerTokens = (tokenValue * qty) / rate;

            const buyer = await findUserRobustly(product.user_id);
            if (!buyer) {
                console.log(`  ⚠️  Buyer not found for product ${product._id} (user_id: ${product.user_id}). Skipping.`);
                continue;
            }

            const buyerStrId = buyer.id || buyer.user_id || buyer._id.toString();
            const buyerObjectId = buyer._id;

            // --- LEVEL 0: Self ROI ---
            const totalL0 = buyerTokens;
            const hasL0 = await LevelIncome.findOne({
                user_id: buyerStrId,
                from_user_id: buyerStrId,
                level: 0,
                product_id: String(product._id)
            });

            if (!hasL0) {
                console.log(`  [MISSING LEVEL 0] Buyer: ${buyer.email} (${buyer.referral_id}) | Product: ${product.packag_type} (${product._id})`);
                if (isWriteMode) {
                    await LevelIncome.create({
                        user_id: buyerStrId,
                        from_user_id: buyerStrId,
                        level: 0,
                        amount: totalL0,
                        product_id: String(product._id),
                        create_at: purchaseDate
                    });
                }
                levelIncomeCreated++;
            }

            // Check Level 0 Distributions
            const existingL0Dists = await MonthlyTokenDistribution.find({
                user_id: buyerObjectId,
                from_purchase_id: product._id,
                level: 0
            });

            if (existingL0Dists.length < 24) {
                console.log(`  [MISSING LEVEL 0 DISTS] Buyer: ${buyer.email} (${buyer.referral_id}) | Found: ${existingL0Dists.length}/24`);
                
                if (isWriteMode) {
                    if (existingL0Dists.length > 0) {
                        await MonthlyTokenDistribution.deleteMany({
                            user_id: buyerObjectId,
                            from_purchase_id: product._id,
                            level: 0
                        });
                    }

                    const distBatch = [];
                    for (let inst = 1; inst <= 24; inst++) {
                        const scheduledDate = new Date(purchaseDate);
                        scheduledDate.setDate(scheduledDate.getDate() + ((inst - 1) * 15));
                        const status = scheduledDate <= now ? 'paid' : 'pending';

                        distBatch.push({
                            user_id: buyerObjectId,
                            from_purchase_id: product._id,
                            from_user_id: buyerObjectId,
                            level: 0,
                            monthly_amount: totalL0 / 24,
                            month_number: inst,
                            status: status,
                            scheduled_date: scheduledDate
                        });
                    }
                    await MonthlyTokenDistribution.insertMany(distBatch);
                }
                distributionsCreated += 24;
            }

            // --- LEVEL 1-25 Sponsor Incomes ---
            let currentNode = buyer;
            let levelDistributed = 0;

            while (levelDistributed < 25) {
                if (!currentNode.sponsor_id) break;

                const upline = await findUserRobustly(currentNode.sponsor_id);
                if (!upline) break;

                const eligible = await isUserEligible(upline._id);
                if (eligible) {
                    const uplineStrId = upline.id || upline.user_id || upline._id.toString();
                    const pct = LEVEL_PERCENTAGES[levelDistributed];
                    const totalAnnualTokens = (buyerTokens * pct) / 100;
                    const installmentAmount = totalAnnualTokens / 24;

                    // Check if LevelIncome record exists
                    const existingIncome = await LevelIncome.findOne({
                        user_id: uplineStrId,
                        from_user_id: buyerStrId,
                        level: levelDistributed + 1,
                        product_id: String(product._id)
                    });

                    if (!existingIncome) {
                        console.log(`  [MISSING LEVEL ${levelDistributed + 1}] Sponsor: ${upline.email} (${upline.referral_id}) | Product: ${product.packag_type} (${product._id})`);
                        if (isWriteMode) {
                            await LevelIncome.create({
                                user_id: uplineStrId,
                                from_user_id: buyerStrId,
                                level: levelDistributed + 1,
                                amount: totalAnnualTokens,
                                product_id: String(product._id),
                                create_at: purchaseDate
                            });
                        }
                        levelIncomeCreated++;
                    }

                    // Check if 24 MonthlyTokenDistribution records exist
                    const existingDists = await MonthlyTokenDistribution.find({
                        user_id: upline._id,
                        from_purchase_id: product._id,
                        level: levelDistributed + 1
                    });

                    if (existingDists.length < 24) {
                        console.log(`  [MISSING LEVEL ${levelDistributed + 1} DISTS] Sponsor: ${upline.email} (${upline.referral_id}) | Found: ${existingDists.length}/24`);
                        if (isWriteMode) {
                            if (existingDists.length > 0) {
                                await MonthlyTokenDistribution.deleteMany({
                                    user_id: upline._id,
                                    from_purchase_id: product._id,
                                    level: levelDistributed + 1
                                });
                            }

                            const distBatch = [];
                            for (let inst = 1; inst <= 24; inst++) {
                                const scheduledDate = new Date(purchaseDate);
                                scheduledDate.setDate(scheduledDate.getDate() + ((inst - 1) * 15));
                                const status = scheduledDate <= now ? 'paid' : 'pending';

                                distBatch.push({
                                    user_id: upline._id,
                                    from_purchase_id: product._id,
                                    from_user_id: buyerObjectId,
                                    level: levelDistributed + 1,
                                    monthly_amount: installmentAmount,
                                    month_number: inst,
                                    status: status,
                                    scheduled_date: scheduledDate
                                });
                            }
                            await MonthlyTokenDistribution.insertMany(distBatch);
                        }
                        distributionsCreated += 24;
                    }
                } else {
                    // Log ineligible sponsor skip if they are SGN9734 to show it works
                    if (currentNode.sponsor_id.toUpperCase() === 'SGN9734') {
                        console.log(`  [INFO] Level ${levelDistributed + 1} Sponsor SGN9734 is ineligible. Skipped correctly.`);
                    }
                }

                levelDistributed++;
                currentNode = upline;
            }
        }

        console.log(`\nReconciliation check done.`);
        console.log(`  LevelIncome records created/missing: ${levelIncomeCreated}`);
        console.log(`  MonthlyTokenDistribution records created/missing: ${distributionsCreated}`);

        // --- User Balance Sync ---
        console.log(`\n--- Syncing User Balances ---`);
        const allUsers = await User.find({});
        console.log(`Syncing balances for ${allUsers.length} users...`);

        let syncCount = 0;

        for (const user of allUsers) {
            const queryIds = [user.id, user.user_id, user._id.toString()].filter(Boolean);

            // 1. Sum lifetime Level Income (Level 1-25)
            const levelIncomes = await LevelIncome.find({ user_id: { $in: queryIds }, level: { $gt: 0 } });
            const totalLifetimeLevelIncome = levelIncomes.reduce((sum, inc) => sum + inc.amount, 0);

            // 2. Sum lifetime Mining Bonus (Level 0)
            const miningIncomes = await LevelIncome.find({ user_id: { $in: queryIds }, level: 0 });
            const totalLifetimeMiningBonus = miningIncomes.reduce((sum, inc) => sum + inc.amount, 0);

            // 3. Sum approved withdrawals
            const approvedWithdrawals = await Withdrawal.find({
                user_id: { $in: queryIds },
                approve: "1" // Approved
            });

            const withdrawnLevel = approvedWithdrawals
                .filter(w => w.withdraw_type === 'level_income' || w.withdraw_type === 'level')
                .reduce((sum, w) => sum + w.amount, 0);
            
            const withdrawnMining = approvedWithdrawals
                .filter(w => w.withdraw_type === 'mining_bonus')
                .reduce((sum, w) => sum + w.amount, 0);

            // 4. Sum paid distributions (for withdrawable_level_income)
            const paidDists = await MonthlyTokenDistribution.find({
                user_id: user._id,
                level: { $gt: 0 },
                status: 'paid'
            });
            const totalMaturedLevel = paidDists.reduce((sum, d) => sum + d.monthly_amount, 0);

            // Final calculations
            const finalLevelIncome = Math.max(0, totalLifetimeLevelIncome - withdrawnLevel);
            const finalMiningBonus = Math.max(0, totalLifetimeMiningBonus - withdrawnMining);
            const finalTotalIncome = finalLevelIncome + finalMiningBonus + Number(user.sponsor_income || 0) + Number(user.anual_bonus || 0);
            const finalWithdrawableLevelIncome = Math.max(0, totalMaturedLevel - withdrawnLevel);

            const needsUpdate = 
                Math.abs((user.level_income || 0) - finalLevelIncome) > 0.001 ||
                Math.abs((user.mining_bonus || 0) - finalMiningBonus) > 0.001 ||
                Math.abs((user.total_income || 0) - finalTotalIncome) > 0.001 ||
                Math.abs((user.withdrawable_level_income || 0) - finalWithdrawableLevelIncome) > 0.001;

            if (needsUpdate) {
                console.log(`  [UPDATE] User: ${user.email || user.referral_id}`);
                console.log(`    Level Income: ${user.level_income || 0} -> ${finalLevelIncome}`);
                console.log(`    Mining Bonus: ${user.mining_bonus || 0} -> ${finalMiningBonus}`);
                console.log(`    Total Income: ${user.total_income || 0} -> ${finalTotalIncome}`);
                console.log(`    Withdrawable Level: ${user.withdrawable_level_income || 0} -> ${finalWithdrawableLevelIncome}`);

                if (isWriteMode) {
                    await User.updateOne(
                        { _id: user._id },
                        {
                            $set: {
                                level_income: finalLevelIncome,
                                mining_bonus: finalMiningBonus,
                                total_income: finalTotalIncome,
                                withdrawable_level_income: finalWithdrawableLevelIncome
                            }
                        }
                    );
                }
                syncCount++;
            }
        }

        console.log(`\nSynchronization complete.`);
        console.log(`  User balances synchronized: ${syncCount}`);

        process.exit(0);
    } catch (err) {
        console.error('Execution Error:', err);
        process.exit(1);
    }
}

run();
