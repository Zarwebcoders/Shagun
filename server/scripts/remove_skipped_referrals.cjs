const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const ReferralIncomes = require('../models/ReferralIncomes');
const Transaction = require('../models/Transaction');

const MILKISH_LEVELS = [1200, 600, 400, 400, 400, 400, 300, 300, 300, 300];

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
    console.log(`=== REFERRAL CLEANUP SCRIPT ===`);
    console.log(`Mode: ${isWriteMode ? 'WRITE (DB WILL BE MODIFIED)' : 'DRY RUN (NO CHANGES)'}`);
    console.log(`================================\n`);

    try {
        const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB.');

        // Build cache
        await buildUserCache();

        const allRecords = await ReferralIncomes.find({}).lean();
        console.log(`Found ${allRecords.length} referral income records to analyze.\n`);

        let skippedCount = 0;
        let processedCount = 0;
        const skippedRecords = [];

        for (const record of allRecords) {
            processedCount++;
            
            const buyer = findUserRobustlyCached(record.referred_user_id);
            const earner = findUserRobustlyCached(record.earner_user_id);

            if (!buyer || !earner) {
                // Since Mongoose models are used, if we still need to save we will load them as Mongoose documents.
                // We'll log the skip
                continue;
            }

            // Trace upline chain sequentially (no skipping)
            const uplineChain = [];
            let current = buyer;
            for (let i = 0; i < 15; i++) {
                if (!current.sponsor_id) break;
                const sponsor = findUserRobustlyCached(current.sponsor_id);
                if (!sponsor) break;
                uplineChain.push(sponsor);
                current = sponsor;
            }

            let isSkipped = false;
            let reason = '';

            if (Number(record.percentage) === 8 || Number(record.percentage) === 8.00) {
                // Standard referral (8%): Earner must be direct sponsor (index 0)
                const directSponsor = uplineChain[0];
                if (!directSponsor) {
                    isSkipped = true;
                    reason = 'Buyer has no upline sponsor chain';
                } else if (directSponsor._id.toString() !== earner._id.toString()) {
                    isSkipped = true;
                    reason = `Earner is ${earner.email} (${earner.referral_id}) but direct sponsor is ${directSponsor.email} (${directSponsor.referral_id})`;
                }
            } else if (Number(record.percentage) === 0) {
                // Milkish 15K referral (10 levels)
                // Determine quantity from txn amount
                const qty = Math.max(1, Math.round(record.amount / 15000));
                
                // Find earner's level in upline chain
                const earnerIndex = uplineChain.findIndex(u => u._id.toString() === earner._id.toString());
                if (earnerIndex === -1) {
                    isSkipped = true;
                    reason = `Earner ${earner.email} is not in buyer's upline chain`;
                } else {
                    const level = earnerIndex + 1; // 1-indexed
                    if (level > MILKISH_LEVELS.length) {
                        isSkipped = true;
                        reason = `Earner is at Level ${level} which exceeds the 10-level Milkish limit`;
                    } else {
                        const expectedCommission = MILKISH_LEVELS[level - 1] * qty;
                        if (Number(record.referral_amount) !== expectedCommission) {
                            isSkipped = true;
                            reason = `Earner is Level ${level} (expected ₹${expectedCommission}) but received ₹${record.referral_amount} due to compression`;
                        }
                    }
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
                console.log(`[SKIPPED REFERRAL #${skippedCount}]`);
                console.log(`  - Record ID: ${record._id}`);
                console.log(`  - Buyer: ${buyer.full_name} (${buyer.referral_id})`);
                console.log(`  - Earner: ${earner.full_name} (${earner.referral_id})`);
                console.log(`  - Amount: ₹${record.referral_amount} (Txn Val: ₹${record.amount}, Pct: ${record.percentage}%)`);
                console.log(`  - Reason: ${reason}\n`);
            }
        }

        console.log(`\n--- ANALYSIS SUMMARY ---`);
        console.log(`Total records analyzed: ${allRecords.length}`);
        console.log(`Skipped/Compressed records found: ${skippedCount}`);
        console.log(`-------------------------\n`);

        if (skippedCount === 0) {
            console.log('No skipped or compressed referral records found.');
            process.exit(0);
        }

        if (isWriteMode) {
            console.log('Executing database modifications...');
            let deletedCount = 0;
            let totalDeducted = 0;

            for (const item of skippedRecords) {
                const { record, earner, buyer } = item;
                const amount = record.referral_amount || 0;

                // Load Mongoose Document of earner to save changes
                const earnerDoc = await User.findById(earner._id);
                if (earnerDoc) {
                    const originalSponsorIncome = earnerDoc.sponsor_income || 0;
                    const originalTotalIncome = earnerDoc.total_income || 0;

                    earnerDoc.sponsor_income = Math.max(0, originalSponsorIncome - amount);
                    earnerDoc.total_income = Math.max(0, originalTotalIncome - amount);
                    await earnerDoc.save();

                    console.log(`  - Deducted ₹${amount} from ${earnerDoc.email} (Sponsor Income: ₹${originalSponsorIncome} -> ₹${earnerDoc.sponsor_income})`);
                }

                // 2. Delete Transaction record
                const txnResult = await Transaction.deleteMany({
                    user: earner._id,
                    type: { $in: ['referral', 'referral_income'] },
                    amount: amount,
                    relatedUser: buyer._id
                });
                console.log(`  - Deleted ${txnResult.deletedCount} transaction record(s)`);

                // 3. Delete ReferralIncomes record
                await ReferralIncomes.findByIdAndDelete(record._id);
                console.log(`  - Deleted ReferralIncomes record ${record._id}`);

                deletedCount++;
                totalDeducted += amount;
                console.log('');
            }

            console.log(`\n--- WRITE COMPLETE ---`);
            console.log(`Successfully removed ${deletedCount} records.`);
            console.log(`Total deducted amount: ₹${totalDeducted}`);
        } else {
            console.log('Dry run complete. No modifications were made to the database.');
            console.log('To apply these changes, run the script with the write option:');
            console.log('  node scripts/remove_skipped_referrals.cjs --write');
        }

        process.exit(0);
    } catch (err) {
        console.error('Execution Error:', err);
        process.exit(1);
    }
}

run();
