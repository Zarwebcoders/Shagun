const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

/**
 * Product definitions with token values
 */
const PRODUCT_DEFINITIONS = {
    1: { name: 'Milkish Herbal', price: 11000, tokenValue: 10000 },
    2: { name: 'Petro', price: 12500, tokenValue: 10000 },
    3: { name: 'Smart Home', price: 20000, tokenValue: 10000 },
    4: { name: 'Shagun EV', price: 85000, tokenValue: 20000 }
};

/**
 * 25-level monthly percentages (for 12 months)
 */
const LEVEL_PERCENTAGES = [
    3.6,   // Level 1
    1.8,   // Level 2
    1.2,   // Level 3
    0.96,  // Level 4
    0.6,   // Level 5
    0.6,   // Level 6
    0.36,  // Level 7
    0.36,  // Level 8
    0.36,  // Level 9
    0.24,  // Level 10
    0.24,  // Level 11
    0.24,  // Level 12
    0.24,  // Level 13
    0.24,  // Level 14
    0.12,  // Level 15
    0.12,  // Level 16
    0.12,  // Level 17
    0.12,  // Level 18
    0.12,  // Level 19
    0.06,  // Level 20
    0.06,  // Level 21
    0.06,  // Level 22
    0.06,  // Level 23
    0.06,  // Level 24
    0.06   // Level 25
];

/**
 * Check if user is eligible for level income
 * Eligibility: User must have purchased any product before OR have loyalty tokens
 */
const isUserEligible = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return false;

        // Check if user has any approved product purchase using raw DB driver to bypass Mongoose cast bugs
        const hasPurchase = await mongoose.connection.db.collection('products').findOne({
            $and: [
                {
                    $or: [
                        { user_id: user._id },
                        { user_id: user.user_id },
                        { user_id: user.id },
                        { user_id: String(user._id) }
                    ]
                },
                { approve: '1' }
            ]
        });

        if (hasPurchase) return true;

        // Check if user has loyalty/shopping tokens
        if (user && (user.shopping_tokens > 0 || user.airdrop_tokens > 0)) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking eligibility:', error);
        return false;
    }
};

/**
 * Distribute 25-level income with monthly payouts
 * @param {ObjectId} buyerUserId - The user who purchased the product
 * @param {Number} tokenValue - Token value (10000 or 20000)
 * @param {Number} quantity - Quantity purchased
 * @param {ObjectId} productId - Product document ID
 */
const distributeLevelIncome25 = async (buyerUserId, tokenValue, quantity, productId) => {
    try {
        const baseAmount = tokenValue * quantity;
        console.log("distributeLevelIncome: Base amounts calculated:", baseAmount);
        let currentUser = await User.findById(buyerUserId);
        console.log("distributeLevelIncome: Current User Found:", currentUser ? currentUser.email : "NO");

        if (!currentUser) {
            console.error(`Buyer user not found: ${buyerUserId}`);
            return;
        }

        // Get token rate based on product purchase date
        let tokenRate = 5.8; // Default to latest
        let pDate = new Date(); // Fallback if no creation date
        try {
            const product = await Product.findById(productId);
            if (product && product.cereate_at) {
                pDate = new Date(product.cereate_at);
                const d6 = new Date('2025-12-06T00:00:00+05:30');
                const d27 = new Date('2025-12-27T00:00:00+05:30');
                const j12 = new Date('2026-01-12T00:00:00+05:30');

                if (pDate < d6) tokenRate = 4.0;
                else if (pDate >= d6 && pDate < d27) tokenRate = 4.8;
                else if (pDate >= d27 && pDate < j12) tokenRate = 5.8;
                else tokenRate = 7.0;
            }
        } catch (err) {
            console.error('Error fetching product date', err.message);
        }

        console.log(`Starting distribution for product ${productId}, base amount: ₹${baseAmount}, token rate: ₹${tokenRate}`);

        const totalBaseTokens = baseAmount / tokenRate;

        // --- LEVEL 0: BUYER (SELF-ROI) ---
        const buyerMonthlyTokens = totalBaseTokens / 12;
        const baseScheduleDate = pDate;

        console.log(`Level 0: ${currentUser.email} (Buyer) - 100% = ${totalBaseTokens} total tokens = ${buyerMonthlyTokens} tokens/month`);

        const originalBuyerStrId = currentUser.id || currentUser.user_id;

        // Inject 12-month tokens upfront to dashboard balance
        currentUser.level_income = (currentUser.level_income || 0) + totalBaseTokens;
        currentUser.total_income = (currentUser.total_income || 0) + totalBaseTokens;
        await currentUser.save();

        try {
            const LevelIncome = require('../models/LevelIncome');
            await LevelIncome.create({
                user_id: originalBuyerStrId,
                from_user_id: originalBuyerStrId,
                level: 0,
                amount: totalBaseTokens,
                product_id: productId,
                create_at: pDate,
                created_at: pDate
            });
        } catch (err) { console.error('Error logging buyer passbook', err.message); }

        for (let month = 1; month <= 12; month++) {
            const scheduledDate = new Date(baseScheduleDate);
            scheduledDate.setMonth(scheduledDate.getMonth() + month);
            try {
                await MonthlyTokenDistribution.create({
                    user_id: currentUser._id,
                    from_purchase_id: productId,
                    from_user_id: buyerUserId,
                    level: 0,
                    monthly_amount: buyerMonthlyTokens,
                    month_number: month,
                    status: 'pending',
                    scheduled_date: scheduledDate
                });
            } catch (err) {
                console.error('Failed to save MonthlyTokenDistribution for buyer', err.message);
            }
        }

        // --- Traverse 25 levels ---
        for (let level = 0; level < 25; level++) {
            // Find sponsor
            if (!currentUser.sponsor_id) {
                console.log(`No more upline at level ${level + 1}`);
                break;
            }

            let uplineUser;
            if (mongoose.Types.ObjectId.isValid(currentUser.sponsor_id) && String(new mongoose.Types.ObjectId(currentUser.sponsor_id)) === currentUser.sponsor_id) {
                uplineUser = await User.findById(currentUser.sponsor_id);
            } else {
                // Must be a legacy string (e.g. "SGN9000" or just a number)
                uplineUser = await User.findOne({
                    $or: [
                        { referral_id: currentUser.sponsor_id },
                        { user_id: currentUser.sponsor_id },
                        { id: currentUser.sponsor_id }
                    ]
                });
            }

            if (!uplineUser) {
                console.warn(`Upline user not found for ID: ${currentUser.sponsor_id}`);
                break;
            }

            // Check eligibility
            const eligible = await isUserEligible(uplineUser._id);

            if (eligible) {
                const monthlyPercentage = LEVEL_PERCENTAGES[level];

                const monthlyTokenAmount = (totalBaseTokens * monthlyPercentage) / 100;
                const totalAnnualTokens = monthlyTokenAmount * 12;

                console.log(`Level ${level + 1}: ${uplineUser.email} - ${monthlyPercentage}% = ${monthlyTokenAmount} tokens/month`);

                // Inject full 12 month tokens upfront
                uplineUser.level_income = (uplineUser.level_income || 0) + totalAnnualTokens;
                uplineUser.total_income = (uplineUser.total_income || 0) + totalAnnualTokens;
                await uplineUser.save();

                try {
                    const uplineStrId = uplineUser.id || uplineUser.user_id;
                    const LevelIncome = require('../models/LevelIncome');
                    await LevelIncome.create({
                        user_id: uplineStrId,
                        from_user_id: originalBuyerStrId,
                        level: level + 1,
                        amount: totalAnnualTokens,
                        product_id: productId,
                        create_at: pDate
                    });
                } catch (err) { console.error('Error logging passbook', err.message); }

                // Create 12 monthly distribution records
                for (let month = 1; month <= 12; month++) {
                    const scheduledDate = new Date(baseScheduleDate);
                    scheduledDate.setMonth(scheduledDate.getMonth() + month);

                    try {
                        await MonthlyTokenDistribution.create({
                            user_id: uplineUser._id,
                            from_purchase_id: productId,
                            from_user_id: buyerUserId,
                            level: level + 1,
                            monthly_amount: monthlyTokenAmount, // Now storing tokens
                            month_number: month,
                            status: 'pending',
                            scheduled_date: scheduledDate
                        });
                    } catch (err) {
                        console.error('Failed to save MonthlyTokenDistribution for user', uplineUser.email, 'error:', err.message);
                    }
                }

                console.log(`Created 12 monthly records for ${uplineUser.email} at level ${level + 1} (${monthlyTokenAmount} tokens/month)`);
            } else {
                console.log(`Level ${level + 1}: ${uplineUser.email} - NOT ELIGIBLE (no purchases)`);
            }

            // Move to next level
            currentUser = uplineUser;
        }

        console.log('25-level distribution completed');
    } catch (error) {
        console.error('Error in distributeLevelIncome25:', error);
        require('fs').writeFileSync('dist_error.txt', error.stack);
    }
};

/**
 * Distribute referral income (8% of product amount)
 * @param {ObjectId} buyerUserId - The user who purchased
 * @param {Number} productAmount - Product purchase amount
 */
const distributeReferralIncome = async (buyerUserId, productAmount) => {
    try {
        const buyer = await User.findById(buyerUserId);

        if (!buyer || !buyer.sponsor_id) {
            console.log('No sponsor found for referral income');
            return;
        }

        const sponsor = await User.findById(buyer.sponsor_id);

        if (!sponsor) {
            console.warn(`Sponsor not found: ${buyer.sponsor_id}`);
            return;
        }

        const referralIncome = (productAmount * 8) / 100;

        // Add to sponsor's income
        sponsor.sponsor_income = (sponsor.sponsor_income || 0) + referralIncome;
        sponsor.total_income = (sponsor.total_income || 0) + referralIncome;
        await sponsor.save();

        console.log(`Referral income: ₹${referralIncome} credited to ${sponsor.email}`);

        // Create transaction record
        const Transaction = require('../models/Transaction');
        await Transaction.create({
            user: sponsor._id,
            relatedUser: buyerUserId,
            type: 'referral',
            amount: referralIncome,
            description: `Referral Income (8%) from product purchase`,
            status: 'completed',
            hash: `REF${Date.now()}`
        });

    } catch (error) {
        console.error('Error distributing referral income:', error);
    }
};

module.exports = {
    PRODUCT_DEFINITIONS,
    LEVEL_PERCENTAGES,
    distributeLevelIncome25,
    distributeReferralIncome,
    isUserEligible
};
