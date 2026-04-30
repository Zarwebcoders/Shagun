const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Product = require('../models/Product');
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const { distributeLevelIncome25 } = require('../utils/levelIncome25');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Get first 100 users
        const users = await User.find({ is_admin: { $ne: "1" } })
            .sort({ create_at: 1 })
            .limit(100);

        console.log(`Processing ${users.length} users...`);

        const userIds = users.map(u => u.id || u.user_id || u._id.toString());
        const mongoIds = users.map(u => u._id);

        // 2. Clear existing level income records for these users as receivers
        console.log('Cleaning up old LevelIncome and Distribution records...');
        
        await LevelIncome.deleteMany({ user_id: { $in: userIds } });
        await MonthlyTokenDistribution.deleteMany({ user_id: { $in: mongoIds } });

        // 3. Reset balances for these users
        for (const user of users) {
            const oldLevelIncome = Number(user.level_income || 0);
            const oldMiningBonus = Number(user.mining_bonus || 0); 
            
            const newTotalIncome = Math.max(0, (Number(user.total_income || 0)) - oldLevelIncome - oldMiningBonus);
            
            // Use updateOne to bypass validation errors (like invalid emails)
            await User.updateOne(
                { _id: user._id },
                { 
                    $set: { 
                        level_income: 0, 
                        mining_bonus: 0,
                        total_income: newTotalIncome
                    } 
                }
            );
        }
        console.log('Balances reset for 50 users.');

        // 4. Regenerate income based on approved purchases
        const approvedProducts = await Product.find({
            user_id: { $in: [...userIds, ...mongoIds] },
            approve: { $in: [1, "1"] }
        });

        console.log(`Found ${approvedProducts.length} approved products to re-process.`);

        const { PRODUCT_DEFINITIONS } = require('../utils/levelIncome25');

        const getHistoricalRate = (dateString) => {
            const date = new Date(dateString);
            const y = date.getFullYear();
            const m = date.getMonth(); // 0-indexed
            const d = date.getDate();

            let rate = 7.0; // Default

            // Oct 1, 2025 to Dec 5, 2025 = 4rs
            if (date >= new Date(2025, 9, 1) && date <= new Date(2025, 11, 5)) rate = 4.0;
            // Dec 6, 2025 to Dec 26, 2025 = 4.8rs
            else if (date >= new Date(2025, 11, 6) && date <= new Date(2025, 11, 26)) rate = 4.8;
            // Dec 27, 2025 to Jan 12, 2026 = 5.8rs
            else if (date >= new Date(2025, 11, 27) && date <= new Date(2026, 0, 12)) rate = 5.8;
            // Jan 13, 2026 till now = 7rs
            else if (date >= new Date(2026, 0, 13)) rate = 7.0;

            console.log(`Checking rate for date: ${dateString} -> Parsed: ${date.toDateString()} -> Rate: ₹${rate}`);
            return rate;
        };

        for (const product of approvedProducts) {
            const purchaseDate = product.cereate_at || product.create_at || product.created_at;
            const forcedRate = getHistoricalRate(purchaseDate);

            console.log(`Re-distributing for Product ID: ${product._id} (User: ${product.user_id}) | Date: ${purchaseDate} | Rate: ₹${forcedRate}`);
            
            // Handle missing token_value by mapping from product_id or packag_type
            let tVal = product.token_value;
            if (!tVal && product.product_id) {
                tVal = PRODUCT_DEFINITIONS[product.product_id]?.tokenValue;
            }
            if (!tVal && product.packag_type) {
                if (product.packag_type.includes('Herbal')) tVal = 10000;
                else if (product.packag_type.includes('Animal')) tVal = 10000;
                else if (product.packag_type.includes('Petro')) tVal = 10000;
                else if (product.packag_type.includes('Home')) tVal = 10000;
                else if (product.packag_type.includes('EV')) tVal = 20000;
            }

            // Calculate new token amount for the product record itself
            const newProductTokens = (tVal * Number(product.quantity || 1)) / forcedRate;
            product.token_amount = newProductTokens;
            await product.save();

            console.log(`Updated Product ${product._id}: Tokens set to ${newProductTokens} (Rate: ₹${forcedRate})`);

            // Using the updated utility which now takes forcedRate as 5th argument
            await distributeLevelIncome25(
                product.user_id,
                tVal || 10000, 
                Number(product.quantity || 1),
                product._id,
                forcedRate
            );
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
