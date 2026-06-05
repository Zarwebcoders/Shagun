const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Historical Rate Logic for 28th Feb onwards:
 * 1. Feb 28th to March 26th: 8.30rs
 * 2. March 27th to April 20th: 10rs
 * 3. April 21st to Till Now: 12rs
 */
const getHistoricalRate = (dateString) => {
    const date = new Date(dateString);
    if (!dateString || isNaN(date.getTime())) return 12.0;

    // NEW RANGES (Requested by User):
    // Feb 28, 2026 to March 26, 2026 = 8.30rs
    if (date >= new Date(2026, 1, 28) && date <= new Date(2026, 2, 26)) return 8.30;
    // March 27, 2026 to April 20, 2026 = 10rs
    if (date >= new Date(2026, 2, 27) && date <= new Date(2026, 3, 20)) return 10.0;
    // April 21, 2026 till now = 12rs
    if (date >= new Date(2026, 3, 21)) return 12.0;

    // Fallback for anything before Feb 28 (though we shouldn't be processing those)
    return 7.0;
};

async function partialRegenerateV4() {
    try {
        const { LEVEL_PERCENTAGES, PRODUCT_DEFINITIONS } = require('../utils/levelIncome25');
        const User = require('../models/User');
        const Product = require('../models/Product');
        const LevelIncome = require('../models/LevelIncome');
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

        const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
        if (!uri) throw new Error("MONGODB_URL not found in environment");
        
        await mongoose.connect(uri);
        console.log('Connected to MongoDB. Starting PARTIAL REGENERATION (28th Feb Onwards)...');

        const cutOffDate = new Date(2026, 1, 28); // Feb 28, 2026
        const now = new Date();

        // 1. Find all target products
        const targetProducts = await Product.find({
            cereate_at: { $gte: cutOffDate },
            $or: [{ approve: 1 }, { approve: '1' }]
        });

        if (targetProducts.length === 0) {
            console.log("No approved products found from 28th Feb onwards. Nothing to do.");
            process.exit(0);
        }

        const productIds = targetProducts.map(p => p._id);
        console.log(`Found ${targetProducts.length} products to re-process.`);

        // 2. DEDUCT old income from Users before deleting records
        console.log('Deducting old level income from user balances...');
        const oldIncomes = await LevelIncome.find({ product_id: { $in: productIds } });
        for (const record of oldIncomes) {
            // Find user by multiple possible ID formats
            const upline = await User.findOne({ 
                $or: [{ id: record.user_id }, { user_id: record.user_id }] 
            });
            if (upline) {
                upline.level_income = Math.max(0, (upline.level_income || 0) - (record.amount || 0));
                upline.total_income = Math.max(0, (upline.total_income || 0) - (record.amount || 0));
                await upline.save();
            }
        }

        // 3. DEDUCT old withdrawable income from paid installments
        console.log('Deducting old withdrawable income from paid installments...');
        const oldInstallments = await MonthlyTokenDistribution.find({ 
            from_purchase_id: { $in: productIds },
            status: 'paid'
        });
        for (const inst of oldInstallments) {
            const upline = await User.findById(inst.user_id);
            if (upline) {
                upline.withdrawable_level_income = Math.max(0, (upline.withdrawable_level_income || 0) - (inst.monthly_amount || 0));
                await upline.save();
            }
        }

        // 4. CLEAN UP old records for these products
        console.log('Deleting old records for target products...');
        await LevelIncome.deleteMany({ product_id: { $in: productIds } });
        await MonthlyTokenDistribution.deleteMany({ from_purchase_id: { $in: productIds } });

        // 5. REGENERATE
        console.log('Generating new income with updated rates...');
        for (const product of targetProducts) {
            const purchaseDate = new Date(product.cereate_at || product.create_at || product.created_at);
            const forcedRate = getHistoricalRate(purchaseDate);

            let tVal = product.token_value;
            if (!tVal && product.product_id) {
                tVal = PRODUCT_DEFINITIONS[product.product_id]?.tokenValue;
            }
            if (!tVal && product.packag_type) {
                const pkg = product.packag_type;
                if (pkg.includes('Herbal') || pkg.includes('Animal') || pkg.includes('Petro') || pkg.includes('Home')) tVal = 10000;
                else if (pkg.includes('EV')) tVal = 20000;
            }
            tVal = tVal || 10000;

            const totalTokens = (tVal * Number(product.quantity || 1)) / forcedRate;
            product.token_amount = totalTokens;
            await product.save();

            const buyer = await User.findOne({ $or: [{ user_id: product.user_id }, { id: product.user_id }] });
            if (!buyer) continue;

            const originalBuyerStrId = buyer.id || buyer.user_id || buyer._id.toString();
            let currentUser = buyer;

            for (let level = 0; level < 25; level++) {
                if (!currentUser.sponsor_id) break;
                const uplineUser = await User.findOne({ 
                    $or: [{ user_id: currentUser.sponsor_id }, { id: currentUser.sponsor_id }, { referral_id: currentUser.sponsor_id }] 
                });
                if (!uplineUser) break;

                const levelPercentage = LEVEL_PERCENTAGES[level];
                const totalAnnualTokens = (totalTokens * levelPercentage) / 100;
                const installmentAmount = totalAnnualTokens / 24;

                uplineUser.level_income = (uplineUser.level_income || 0) + totalAnnualTokens;
                uplineUser.total_income = (uplineUser.total_income || 0) + totalAnnualTokens;

                await LevelIncome.create({
                    user_id: uplineUser.id || uplineUser.user_id || uplineUser._id.toString(),
                    from_user_id: originalBuyerStrId,
                    level: level + 1,
                    amount: totalAnnualTokens,
                    product_id: product._id,
                    create_at: purchaseDate
                });

                const instBatch = [];
                for (let inst = 1; inst <= 24; inst++) {
                    const scheduledDate = new Date(purchaseDate);
                    scheduledDate.setDate(scheduledDate.getDate() + ((inst - 1) * 15));

                    let status = 'pending';
                    if (scheduledDate <= now) {
                        status = 'paid';
                        uplineUser.withdrawable_level_income = (uplineUser.withdrawable_level_income || 0) + installmentAmount;
                    }

                    instBatch.push({
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
                await MonthlyTokenDistribution.insertMany(instBatch);
                await uplineUser.save();
                currentUser = uplineUser;
            }
            console.log(`Regenerated Product ${product._id} (Rate: ₹${forcedRate})`);
        }

        console.log('PARTIAL REGENERATION COMPLETED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        process.exit(1);
    }
}

partialRegenerateV4();
