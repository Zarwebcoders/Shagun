const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');

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
                // If buyer or earner details are missing, it's an orphan record or legacy user
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

        process.exit(0);
    } catch (err) {
        console.error('Execution Error:', err);
        process.exit(1);
    }
}

run();
