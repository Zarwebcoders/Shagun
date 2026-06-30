const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env before anything else
dotenv.config({ path: '../.env' }); // Assuming running from server/scripts

const Product = require('../models/Product');
const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
// Import the level income script with the definitions
const { distributeLevelIncome25, distributeReferralIncome } = require('../utils/levelIncome25');

async function migrateOldDistributions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected\n');

        console.log("=== STARTING MIGRATION FOR MISSING TOKEN DISTRIBUTIONS ===\n");

        const db = mongoose.connection.db;

        // Fetch products directly from MongoDB to bypass Mongoose schema casting issues temporarily
        // Because "approve" is stored as string "1" for older records, but schema says type: Number
        const productsRaw = await db.collection('products').find({
            $or: [
                { approve: 1 },
                { approve: '1' }
            ]
        }).toArray();

        console.log(`Found ${productsRaw.length} approved products in total.\n`);

        let migratedCount = 0;
        let alreadyExistsCount = 0;
        let errorCount = 0;

        for (const rawProduct of productsRaw) {
            try {
                // 2. Check if this product already has token distributions
                const count = await MonthlyTokenDistribution.countDocuments({ from_purchase_id: rawProduct._id });

                if (count > 0) {
                    alreadyExistsCount++;
                    continue;
                }

                console.log(`[MIGRATING] Product ${rawProduct._id} for product.user_id: ${rawProduct.user_id}...`);

                let objectIdUserId;

                // If it's a valid ObjectId string, use it
                if (mongoose.Types.ObjectId.isValid(rawProduct.user_id) && String(new mongoose.Types.ObjectId(rawProduct.user_id)) === rawProduct.user_id) {
                    objectIdUserId = new mongoose.Types.ObjectId(rawProduct.user_id);
                } else {
                    // Legacy users: product.user_id matches User.id or User.user_id
                    // The $or query failed in powershell but works reliably in Mongoose wrapper
                    const user = await User.findOne({ id: String(rawProduct.user_id) });

                    if (!user) {
                        const user2 = await User.findOne({ user_id: String(rawProduct.user_id) });
                        if (!user2) {
                            console.error(`[SKIP] Could not find User document for legacy ID: ${rawProduct.user_id}`);
                            errorCount++;
                            continue;
                        } else {
                            objectIdUserId = user2._id;
                        }
                    } else {
                        objectIdUserId = user._id; // This is the real MongoDB ObjectId
                    }
                    console.log(`  -> Mapped legacy user ${rawProduct.user_id} to ObjectId ${objectIdUserId}`);
                }

                // 3. Run the 25-level distribution using the real ObjectId
                await distributeLevelIncome25(
                    objectIdUserId,
                    Number(rawProduct.token_value) || 10000,
                    Number(rawProduct.quantity) || 1,
                    rawProduct._id
                );

                // Wait a moment to ensure promises settle, then verify it actually worked
                // because distributeLevelIncome25 logs silently catch errors
                const checkCount = await MonthlyTokenDistribution.countDocuments({ from_purchase_id: rawProduct._id });
                if (checkCount > 0) {
                    migratedCount++;
                    console.log(`[SUCCESS] Distributed tokens for Product ${rawProduct._id} (Found ${checkCount} records)\n`);
                } else {
                    console.log(`[FAILURE] Ran distribution but 0 tokens generated for Product ${rawProduct._id}\n`);
                    errorCount++;
                }

            } catch (err) {
                console.error(`[ERROR] Failed to migrate Product ${rawProduct._id}:`, err);
                errorCount++;
            }
        }

        console.log("\n=== MIGRATION COMPLETE ===");
        console.log(`Total Products: ${productsRaw.length}`);
        console.log(`Already Had Distributions: ${alreadyExistsCount}`);
        console.log(`Successfully Migrated: ${migratedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

migrateOldDistributions();
