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
 * Robustly find a user by any ID (ObjectId, user_id, or legacy id)
 */
const findUserRobustly = async (id) => {
    if (!id) return null;
    
    // 1. Try FindById (Mongoose handles ObjectId conversion)
    if (mongoose.Types.ObjectId.isValid(id)) {
        const user = await User.findById(id);
        if (user) return user;
    }

    // 2. Try FindOne with various ID fields
    return await User.findOne({
        $or: [
            { user_id: id },
            { id: id },
            { referral_id: id }
        ]
    });
};

/**
 * Check if user is eligible for level income
 * Eligibility: User must have purchased any product before OR have loyalty tokens
 */
const isUserEligible = async (userId) => {
    try {
        const user = await findUserRobustly(userId);
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
                {
                    $or: [
                        { approve: '1' },
                        { approve: 1 }
                    ]
                }
            ]
        });

        if (hasPurchase) return true;

        // Check if user has loyalty/shopping tokens (Fixed typos to match User model: tokons)
        if (user && (user.shopping_tokons > 0 || user.airdrop_tokons > 0)) {
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
        let currentUser = await findUserRobustly(buyerUserId);
        console.log("distributeLevelIncome: Current User Found:", currentUser ? currentUser.email : "NO");

        if (!currentUser) {
            console.error(`Buyer user not found: ${buyerUserId}`);
            return;
        }
        
        const buyerObjectId = currentUser._id;

        // Fetch current token rate from settings
        let tokenRate = 7.0; // Default fallback
        try {
            const Setting = require('../models/Setting');
            const rateSetting = await Setting.findOne({ key: 'rexTokenPrice' });
            if (rateSetting) {
                tokenRate = Number(rateSetting.value);
                console.log(`Using dynamic token rate from settings: ₹${tokenRate}`);
            } else {
                console.warn('rexTokenPrice setting not found, using default ₹7.0');
            }
        } catch (err) {
            console.error('Error fetching dynamic token rate:', err.message);
        }

        console.log(`Starting 24-installment distribution for product ${productId}, base amount: ₹${baseAmount}, token rate: ₹${tokenRate}`);

        // --- LEVEL 0: BUYER (SELF-ROI) ---
        const totalBaseTokens = baseAmount / tokenRate;
        const buyerInstallmentTokens = totalBaseTokens / 24;
        const pDate = new Date(); // Use current date for new purchases
        const baseScheduleDate = pDate;

        console.log(`Level 0: ${currentUser.email} (Buyer) - 100% = ${totalBaseTokens} total tokens = ${buyerInstallmentTokens} tokens/installment`);

        const originalBuyerStrId = currentUser.id || currentUser.user_id || currentUser._id.toString();

        // Inject 12-month tokens upfront to dashboard balance
        // Credit the Buyer (Self-ROI/Level 0) as 'mining_bonus' to match UI categories
        currentUser.mining_bonus = (Number(currentUser.mining_bonus || 0)) + totalBaseTokens;
        currentUser.total_income = (Number(currentUser.total_income || 0)) + totalBaseTokens;
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

        for (let inst = 1; inst <= 24; inst++) {
            const scheduledDate = new Date(baseScheduleDate);
            scheduledDate.setDate(scheduledDate.getDate() + ((inst - 1) * 15)); // 15-day intervals, 1st one immediate
            try {
                await MonthlyTokenDistribution.create({
                    user_id: currentUser._id,
                    from_purchase_id: productId,
                    from_user_id: buyerObjectId,
                    level: 0,
                    monthly_amount: buyerInstallmentTokens,
                    month_number: inst,
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

            let uplineUser = await findUserRobustly(currentUser.sponsor_id);

            if (!uplineUser) {
                console.warn(`Upline user not found for ID: ${currentUser.sponsor_id}`);
                break;
            }

            // Check eligibility
            const eligible = await isUserEligible(uplineUser._id);

            if (eligible) {
                const installmentPercentage = LEVEL_PERCENTAGES[level];

                const installmentTokenAmount = (totalBaseTokens * installmentPercentage) / 100;
                const totalAnnualTokens = installmentTokenAmount * 24; // Actually "Total Contract Duration"

                console.log(`Level ${level + 1}: ${uplineUser.email} - ${installmentPercentage}% per installment = ${installmentTokenAmount} tokens/inst`);

                // Inject full 24 installment tokens upfront
                uplineUser.level_income = (Number(uplineUser.level_income || 0)) + totalAnnualTokens;
                uplineUser.total_income = (Number(uplineUser.total_income || 0)) + totalAnnualTokens;
                await uplineUser.save();

                try {
                    const uplineStrId = uplineUser.id || uplineUser.user_id || uplineUser._id.toString();
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

                // Create 24 installment distribution records
                for (let inst = 1; inst <= 24; inst++) {
                    const scheduledDate = new Date(baseScheduleDate);
                    scheduledDate.setDate(scheduledDate.getDate() + ((inst - 1) * 15)); // 1st installment immediate

                    try {
                        await MonthlyTokenDistribution.create({
                            user_id: uplineUser._id,
                            from_purchase_id: productId,
                            from_user_id: buyerObjectId,
                            level: level + 1,
                            monthly_amount: installmentTokenAmount,
                            month_number: inst,
                            status: 'pending',
                            scheduled_date: scheduledDate
                        });
                    } catch (err) {
                        console.error('Failed to save MonthlyTokenDistribution for user', uplineUser.email, 'error:', err.message);
                    }
                }

                console.log(`Created 24 installment records for ${uplineUser.email} at level ${level + 1} (${installmentTokenAmount} tokens/inst)`);
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
        console.log(`distributeReferralIncome: Starting for Buyer: ${buyerUserId}, Amount: ${productAmount}`);
        
        // 1. Find Buyer Robustly
        let buyer = await findUserRobustly(buyerUserId);

        if (!buyer) {
            console.error(`Referral Error: Buyer not found for ID: ${buyerUserId}`);
            return;
        }

        if (!buyer.sponsor_id) {
            console.log(`distributeReferralIncome: No sponsor found for buyer ${buyer.email}`);
            return;
        }

        console.log(`distributeReferralIncome: Buyer ${buyer.email} has sponsor ID: ${buyer.sponsor_id}`);

        // 2. Find Sponsor Robustly
        let sponsor = await findUserRobustly(buyer.sponsor_id);

        if (!sponsor) {
            console.warn(`distributeReferralIncome: Sponsor document not found for sponsor_id: ${buyer.sponsor_id}`);
            return;
        }

        console.log(`distributeReferralIncome: Crediting sponsor ${sponsor.email}`);

        const referralIncome = (productAmount * 8) / 100;

        // Add to sponsor's income
        sponsor.sponsor_income = (Number(sponsor.sponsor_income || 0)) + referralIncome;
        sponsor.total_income = (Number(sponsor.total_income || 0)) + referralIncome;
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

        // NEW: Create ReferralIncomes record for history table
        const ReferralIncomes = require('../models/ReferralIncomes');
        const earnerId = sponsor.id || sponsor.user_id || sponsor._id.toString();
        const referredId = buyer.id || buyer.user_id || buyer._id.toString();
        
        await ReferralIncomes.create({
            earner_user_id: earnerId,
            referred_user_id: referredId,
            product_id: null,
            product_transcation_id: `REF${Date.now()}`,
            amount: productAmount,
            percentage: 8.00,
            referral_amount: referralIncome,
            status: 'credited'
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
