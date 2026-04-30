const mongoose = require('mongoose');
require('dotenv').config();

// Historical Rate Logic (Same as before)
const getHistoricalRate = (dateString) => {
    const date = new Date(dateString);
    if (!dateString || isNaN(date.getTime())) return 7.0; // Fallback to 7

    // Oct 1, 2025 to Dec 5, 2025 = 4rs
    if (date >= new Date(2025, 9, 1) && date <= new Date(2025, 11, 5)) return 4.0;
    // Dec 6, 2025 to Dec 26, 2025 = 4.8rs
    if (date >= new Date(2025, 11, 6) && date <= new Date(2025, 11, 26)) return 4.8;
    // Dec 27, 2025 to Jan 12, 2026 = 5.8rs
    if (date >= new Date(2025, 11, 27) && date <= new Date(2026, 0, 12)) return 5.8;
    // Jan 13, 2026 till now = 7rs
    return 7.0;
};

async function globalRegenerate() {
    try {
        const { distributeLevelIncome25, PRODUCT_DEFINITIONS } = require('../utils/levelIncome25');
        const User = require('../models/User');
        const Product = require('../models/Product');
        const LevelIncome = require('../models/LevelIncome');
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        console.log('Connected to MongoDB. Starting GLOBAL reset...');

        // 1. DELETE ALL Level Income and Installments
        console.log('Cleaning up ALL LevelIncome records...');
        await LevelIncome.deleteMany({});
        
        console.log('Cleaning up ALL Monthly Distribution records...');
        await MonthlyTokenDistribution.deleteMany({});

        // 2. RESET User balances (only level_income part)
        console.log('Resetting all users balances to 0...');
        await User.updateMany({}, { 
            $set: { 
                level_income: 0, 
                total_income: 0,
                withdrawable_level_income: 0 
            } 
        });
        // Note: If you have referral/sponsor income that you want to KEEP, we would need a more complex $inc update.
        // But usually in a full reset, starting from 0 and recalculating everything is safer.

        // 3. Process ALL Approved Products
        const approvedProducts = await Product.find({ 
            $or: [{ approve: 1 }, { approve: '1' }] 
        }).sort({ cereate_at: 1 });

        console.log(`Processing ${approvedProducts.length} approved products with OPTIMIZED bulk logic...`);

        const now = new Date();

        for (const product of approvedProducts) {
            const purchaseDate = new Date(product.cereate_at || product.create_at || product.created_at);
            const forcedRate = getHistoricalRate(purchaseDate);

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
            tVal = tVal || 10000;

            const newTokens = (tVal * Number(product.quantity || 1)) / forcedRate;
            product.token_amount = newTokens;
            await product.save();

            const totalBaseTokens = newTokens;
            const buyer = await User.findOne({ $or: [{ user_id: product.user_id }, { id: product.user_id }] });
            if (!buyer) continue;

            const originalBuyerStrId = buyer.id || buyer.user_id || buyer._id.toString();
            let currentUser = buyer;

            const levelIncomeToCreate = [];
            const installmentsToCreate = [];

            // 25 Level Loop
            for (let level = 0; level < 25; level++) {
                if (!currentUser.sponsor_id) break;

                const uplineUser = await User.findOne({ 
                    $or: [{ user_id: currentUser.sponsor_id }, { id: currentUser.sponsor_id }, { referral_id: currentUser.sponsor_id }] 
                });

                if (!uplineUser) break;

                const levelPercentage = require('../utils/levelIncome25').LEVEL_PERCENTAGES[level];
                const totalAnnualTokens = (totalBaseTokens * levelPercentage) / 100;
                const installmentAmount = totalAnnualTokens / 24;

                uplineUser.level_income = (uplineUser.level_income || 0) + totalAnnualTokens;
                uplineUser.total_income = (uplineUser.total_income || 0) + totalAnnualTokens;

                levelIncomeToCreate.push({
                    user_id: uplineUser.id || uplineUser.user_id || uplineUser._id.toString(),
                    from_user_id: originalBuyerStrId,
                    level: level + 1,
                    amount: totalAnnualTokens,
                    product_id: product._id,
                    create_at: purchaseDate
                });

                for (let inst = 1; inst <= 24; inst++) {
                    const scheduledDate = new Date(purchaseDate);
                    scheduledDate.setDate(scheduledDate.getDate() + ((inst - 1) * 15));

                    let status = 'pending';
                    if (scheduledDate <= now) {
                        status = 'paid';
                        uplineUser.withdrawable_level_income = (uplineUser.withdrawable_level_income || 0) + installmentAmount;
                    }

                    installmentsToCreate.push({
                        user_id: uplineUser._id,
                        from_purchase_id: product._id,
                        from_user_id: buyer._id,
                        level: level + 1,
                        monthly_amount: installmentAmount,
                        month_number: inst,
                        status: status,
                        scheduled_date: scheduledDate
                    });
                }

                await uplineUser.save();
                currentUser = uplineUser;
            }

            // Bulk Inserts for this product
            if (levelIncomeToCreate.length > 0) await LevelIncome.insertMany(levelIncomeToCreate);
            if (installmentsToCreate.length > 0) await MonthlyTokenDistribution.insertMany(installmentsToCreate);

            console.log(`Finished processing Product ${product._id} for ${buyer.full_name}`);
        }

        console.log('GLOBAL REGENERATION COMPLETED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('CRITICAL ERROR during global reset:', err);
        process.exit(1);
    }
}

globalRegenerate();
