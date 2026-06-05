const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const Transaction = require('../models/Transaction');

const userCache = new Map();
const userCacheByUserId = new Map();
const userCacheByReferralId = new Map();
const userCacheById = new Map();

async function buildUserCache() {
    console.log('Loading users into memory for fast lookup...');
    const allUsers = await User.find({}).lean();
    for (const u of allUsers) {
        userCache.set(u._id.toString(), u);
        if (u.user_id) {
            userCacheByUserId.set(u.user_id.trim().toUpperCase(), u);
        }
        if (u.referral_id) {
            userCacheByReferralId.set(u.referral_id.trim().toUpperCase(), u);
        }
        if (u.id) {
            userCacheById.set(String(u.id).trim(), u);
        }
    }
    console.log(`Loaded ${allUsers.length} users into cache.\n`);
}

function findUserRobustlyCached(id) {
    if (!id) return null;
    const raw = String(id).trim().replace(/\s+/g, '');
    
    if (userCache.has(raw)) return userCache.get(raw);
    
    const upper = raw.toUpperCase();
    if (userCacheByUserId.has(upper)) return userCacheByUserId.get(upper);
    if (userCacheByReferralId.has(upper)) return userCacheByReferralId.get(upper);
    if (userCacheById.has(raw)) return userCacheById.get(raw);
    
    return null;
}

async function run() {
    const isWriteMode = process.argv.includes('--write') || process.argv.includes('write');
    console.log(`=== LEVEL INCOME CLEANUP SCRIPT ===`);
    console.log(`Mode: ${isWriteMode ? 'WRITE (DB WILL BE MODIFIED)' : 'DRY RUN (NO CHANGES)'}`);
    console.log(`====================================\n`);

    try {
        const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB.');

        // Build cache
        await buildUserCache();

        const allRecords = await LevelIncome.find({}).lean();
        console.log(`Found ${allRecords.length} level income records to analyze.\n`);

        let skippedCount = 0;
        let processedCount = 0;
        const skippedRecords = [];

        for (const record of allRecords) {
            processedCount++;
            
            const buyer = findUserRobustlyCached(record.from_user_id);
            const earner = findUserRobustlyCached(record.user_id);

            if (!buyer || !earner) {
                continue;
            }

            // Trace upline chain sequentially (no skipping)
            const uplineChain = [];
            let current = buyer;
            for (let i = 0; i < 25; i++) {
                if (!current.sponsor_id) break;
                const sponsor = findUserRobustlyCached(current.sponsor_id);
                if (!sponsor) break;
                uplineChain.push(sponsor);
                current = sponsor;
            }

            // Find earner's actual level in the sequential chain
            const earnerIndex = uplineChain.findIndex(u => u._id.toString() === earner._id.toString());
            
            let isSkipped = false;
            let reason = '';

            if (earnerIndex === -1) {
                isSkipped = true;
                reason = `Earner ${earner.email} (${earner.referral_id}) is not in buyer's upline chain`;
            } else {
                const actualLevel = earnerIndex + 1; // 1-indexed
                if (Number(record.level) !== Number(actualLevel)) {
                    isSkipped = true;
                    reason = `Recorded as Level ${record.level} but is actually Level ${actualLevel} in the sequential chain (compressed)`;
                }
            }

            if (isSkipped) {
                skippedCount++;
                skippedRecords.push({
                    record,
                    earner,
                    buyer,
                    reason
                });
                
                console.log(`[SKIPPED LEVEL INCOME #${skippedCount}]`);
                console.log(`  - Record ID: ${record._id}`);
                console.log(`  - Buyer: ${buyer.full_name} (${buyer.referral_id})`);
                console.log(`  - Earner: ${earner.full_name} (${earner.referral_id})`);
                console.log(`  - Recorded Level: ${record.level}`);
                console.log(`  - Amount: ${record.amount} tokens`);
                console.log(`  - Reason: ${reason}\n`);
            }
        }

        console.log(`\n--- ANALYSIS SUMMARY ---`);
        console.log(`Total Level Income records analyzed: ${allRecords.length}`);
        console.log(`Skipped/Compressed Level Income records found: ${skippedCount}`);
        console.log(`-------------------------\n`);

        if (skippedCount === 0) {
            console.log('No skipped or compressed level income records found.');
            process.exit(0);
        }

        if (isWriteMode) {
            console.log('Executing database modifications...');
            let deletedCount = 0;
            let totalDeducted = 0;

            for (const item of skippedRecords) {
                const { record, earner, buyer } = item;
                const amount = record.amount || 0;

                // 1. Deduct from Earner balances
                const earnerDoc = await User.findById(earner._id);
                if (earnerDoc) {
                    const originalLevelIncome = earnerDoc.level_income || 0;
                    const originalTotalIncome = earnerDoc.total_income || 0;

                    earnerDoc.level_income = Math.max(0, originalLevelIncome - amount);
                    earnerDoc.total_income = Math.max(0, originalTotalIncome - amount);
                    await earnerDoc.save();

                    console.log(`  - Deducted ${amount.toFixed(4)} tokens from ${earnerDoc.email} (Level Income: ${originalLevelIncome.toFixed(4)} -> ${earnerDoc.level_income.toFixed(4)})`);
                }

                // 2. Delete Monthly Token Distributions
                const distResult = await MonthlyTokenDistribution.deleteMany({
                    user_id: earner._id,
                    from_purchase_id: record.product_id,
                    level: record.level
                });
                console.log(`  - Deleted ${distResult.deletedCount} monthly installment distributions`);

                // 3. Delete Transaction record if exists
                const txnResult = await Transaction.deleteMany({
                    user: earner._id,
                    type: { $in: ['level_income', 'referral_income'] }, // sometimes recorded as referral_income or level_income
                    amount: amount,
                    relatedUser: buyer._id
                });
                console.log(`  - Deleted ${txnResult.deletedCount} transaction record(s)`);

                // 4. Delete LevelIncome record
                await LevelIncome.findByIdAndDelete(record._id);
                console.log(`  - Deleted LevelIncome record ${record._id}`);

                deletedCount++;
                totalDeducted += amount;
                console.log('');
            }

            console.log(`\n--- WRITE COMPLETE ---`);
            console.log(`Successfully removed ${deletedCount} records.`);
            console.log(`Total deducted amount: ${totalDeducted.toFixed(4)} tokens`);
        } else {
            console.log('Dry run complete. No modifications were made to the database.');
            console.log('To apply these changes, run the script with the write option:');
            console.log('  node scripts/remove_skipped_level_incomes.cjs --write');
        }

        process.exit(0);
    } catch (err) {
        console.error('Execution Error:', err);
        process.exit(1);
    }
}

run();
