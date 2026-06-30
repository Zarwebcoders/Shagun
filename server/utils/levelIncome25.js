const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

/**
 * Product definitions with token values
 * UPDATED: Milkish Herbal price changed to 15000, tokens remain 10000
 */
const PRODUCT_DEFINITIONS = {
    1: { name: 'Milkish Herbal', price: 15000, tokenValue: 10000 },
    2: { name: 'Petro', price: 12500, tokenValue: 10000 },
    3: { name: 'Smart Home', price: 20000, tokenValue: 10000 },
    4: { name: 'Shagun EV', price: 90000, tokenValue: 20000 }
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
 * Normalises the id: strips whitespace & does case-insensitive match so that
 * "SGN9007", "sgn9007", "Sgn9007", "SGN 9007" all resolve to the same user.
 */
const findUserRobustly = async (id) => {
    if (!id) return null;

    // Strip all internal/external spaces, e.g. "SGN 9007" → "SGN9007"
    const raw = String(id).trim().replace(/\s+/g, '');

    // 1. Try FindById (Mongoose handles ObjectId conversion)
    if (mongoose.Types.ObjectId.isValid(raw)) {
        const user = await User.findById(raw);
        if (user) return user;
    }

    // 2. Case-insensitive regex match against all ID fields
    const regex = new RegExp(`^${raw}$`, 'i');
    return await User.findOne({
        $or: [
            { user_id: regex },
            { id: raw },         // legacy numeric id – exact match is fine
            { referral_id: regex }
        ]
    });
};

/**
 * Check if user is eligible for level income
 * Eligibility: 
 *   1. User must be ACTIVE (not deactivated by admin — is_deleted must not be "1" or 1)
 *   2. User must have purchased any product before OR have loyalty tokens
 */
const isUserEligible = async (userId) => {
    try {
        const user = await findUserRobustly(userId);
        if (!user) return false;

        // CHECK 1: Admin active ID check (MUST be 0 to be active)
        const isAdminActive = String(user.is_deleted) === "0";
        if (!isAdminActive) {
            console.log(`User ${user.email} not eligible: Deactivated by admin.`);
            return false;
        }

        // CHECK 2: User must have an approved product purchase
        // Using raw DB driver to bypass Mongoose cast bugs
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

        // CHECK 3: User has loyalty/shopping tokens (Fixed typos to match User model: tokons)
        if (user && (Number(user.shopping_tokons || 0) > 0 || Number(user.airdrop_tokons || 0) > 0)) {
            return true;
        }

        console.log(`User ${user.email} not eligible: No approved products and no tokens.`);
        return false;
    } catch (error) {
        console.error('Error checking eligibility:', error);
        return false;
    }
};

/**
 * Distribute 25-level income with monthly payouts
 */
async function distributeLevelIncome25(userId, baseAmount, quantity, productId, forcedRate = null) {
    try {
        const User = require('../models/User');
        const Product = require('../models/Product');
        const LevelIncome = require('../models/LevelIncome');
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

        const mongoose = require('mongoose');
        let currentUser = null;
        
        if (mongoose.Types.ObjectId.isValid(userId)) {
            currentUser = await User.findById(userId);
        }
        
        if (!currentUser) {
            currentUser = await User.findOne({ 
                $or: [{ user_id: userId }, { id: userId }, { referral_id: userId }] 
            });
        }

        if (!currentUser) {
            console.error(`User not found for income distribution: ${userId}`);
            return;
        }

        let tokenRate = 12.0; // Default

        if (forcedRate) {
            tokenRate = Number(forcedRate);
            console.log(`Using FORCED historical token rate: ₹${tokenRate}`);
        } else {
            try {
                const Setting = require('../models/Setting');
                const rateSetting = await Setting.findOne({ key: 'rexTokenPrice' });
                if (rateSetting) {
                    tokenRate = Number(rateSetting.value);
                    console.log(`Using dynamic token rate from settings: ₹${tokenRate}`);
                }
            } catch (err) {
                console.error('Error fetching dynamic token rate:', err.message);
            }
        }

        console.log(`Starting 24-installment distribution for product ${productId}, base amount: ₹${baseAmount}, token rate: ₹${tokenRate}`);

        const totalBaseTokens = (baseAmount * quantity) / tokenRate;
        const pDate = new Date(); 
        const baseScheduleDate = pDate;
        const originalBuyerStrId = currentUser._id.toString();
        const buyerObjectId = currentUser._id;

        // --- LEVEL 0: Self ROI ---
        const totalL0 = totalBaseTokens;
        
        // Find if Level 0 record already exists to avoid double-counting
        const hasL0 = await LevelIncome.findOne({
            user_id: originalBuyerStrId,
            from_user_id: originalBuyerStrId,
            level: 0,
            product_id: productId
        });

        if (!hasL0) {
            console.log(`Distributing Level 0 Self-ROI: ${totalL0} tokens for product ${productId}`);
            
            await LevelIncome.create({
                user_id: originalBuyerStrId,
                from_user_id: originalBuyerStrId,
                level: 0,
                amount: totalL0,
                product_id: productId,
                create_at: pDate
            });

            currentUser.mining_bonus = (Number(currentUser.mining_bonus || 0)) + totalL0;
            currentUser.total_income = (Number(currentUser.total_income || 0)) + totalL0;
            await currentUser.save();

            // Create 24 installments for Mining Bonus (ROI) - every 15 days starting Day 0
            for (let inst = 1; inst <= 24; inst++) {
                const scheduledDate = new Date(baseScheduleDate);
                scheduledDate.setDate(scheduledDate.getDate() + ((inst - 1) * 15));

                try {
                    await MonthlyTokenDistribution.create({
                        user_id: buyerObjectId,
                        from_purchase_id: productId,
                        from_user_id: buyerObjectId,
                        level: 0,
                        monthly_amount: totalL0 / 24,
                        month_number: inst,
                        status: 'pending',
                        scheduled_date: scheduledDate
                    });
                } catch (err) {
                    console.error('Error creating Level 0 MonthlyTokenDistribution:', err.message);
                }
            }
        }

        // --- Traverse 25 levels sequentially (Option 2: No shifting, check eligibility) ---
        let levelDistributed = 0;
        let currentUplineTracker = currentUser;

        while (levelDistributed < 25) {
            if (!currentUplineTracker.sponsor_id) break;

            let uplineUser = await findUserRobustly(currentUplineTracker.sponsor_id);
            if (!uplineUser) break;

            const eligible = await isUserEligible(uplineUser._id);
            if (eligible) {
                const levelPercentage = LEVEL_PERCENTAGES[levelDistributed];
                const totalAnnualTokens = (totalBaseTokens * levelPercentage) / 100;
                const installmentTokenAmount = totalAnnualTokens / 24;

                uplineUser.level_income = (Number(uplineUser.level_income || 0)) + totalAnnualTokens;
                uplineUser.total_income = (Number(uplineUser.total_income || 0)) + totalAnnualTokens;
                await uplineUser.save();

                try {
                    const uplineStrId = uplineUser._id.toString();
                    await LevelIncome.create({
                        user_id: uplineStrId,
                        from_user_id: originalBuyerStrId,
                        level: levelDistributed + 1,
                        amount: totalAnnualTokens,
                        product_id: productId,
                        create_at: pDate
                    });
                } catch (err) { console.error('Error logging passbook', err.message); }

                // Create notification for level income
                try {
                    const Notification = require('../models/Notification');
                    await Notification.create({
                        user_id: uplineUser._id,
                        message: `You received Level ${levelDistributed + 1} Income from a downline purchase.`,
                        type: 'income',
                        path: '/level-income'
                    });
                } catch (err) {
                    console.error("Failed to create level income notification:", err.message);
                }

                for (let inst = 1; inst <= 24; inst++) {
                    const scheduledDate = new Date(baseScheduleDate);
                    scheduledDate.setDate(scheduledDate.getDate() + ((inst - 1) * 15));

                    try {
                        await MonthlyTokenDistribution.create({
                            user_id: uplineUser._id,
                            from_purchase_id: productId,
                            from_user_id: buyerObjectId,
                            level: levelDistributed + 1,
                            monthly_amount: installmentTokenAmount,
                            month_number: inst,
                            status: 'pending',
                            scheduled_date: scheduledDate
                        });
                    } catch (err) {}
                }
            } else {
                console.log(`Level ${levelDistributed + 1} Sponsor ${uplineUser.email} is inactive/ineligible. Level commission skipped.`);
            }

            levelDistributed++;
            currentUplineTracker = uplineUser;
        }
    } catch (error) {
        console.error('Error in distributeLevelIncome25:', error);
    }
}

/**
 * Distribute referral income
 * MODIFIED: Support 10-level fixed referral for Milkish 15,000 product
 */
const distributeReferralIncome = async (buyerUserId, productAmount, productId = null, txnId = null) => {
    try {
        console.log(`distributeReferralIncome: Starting for Buyer: ${buyerUserId}, Amount: ${productAmount}, ProductId: ${productId}`);
        
        let buyer = await findUserRobustly(buyerUserId);
        if (!buyer) return;

        // Find the product to check if it's the 15k Milkish
        const productDoc = await Product.findById(productId);
        const isMilkish15k = productDoc && productDoc.packag_type?.includes('Milkish') && productAmount >= 15000;

        if (isMilkish15k) {
            const qty = productDoc?.quantity || 1;
            console.log(`MILKISH 15K DETECTED: Starting 10-level referral distribution (Option 2: No shifting, check eligibility). Quantity: ${qty}`);
            const MILKISH_LEVELS = [1200, 600, 400, 400, 400, 400, 300, 300, 300, 300];
            
            let currentUplineTracker = buyer;
            let levelDistributed = 0;

            while (levelDistributed < MILKISH_LEVELS.length) {
                if (!currentUplineTracker.sponsor_id) break;

                let sponsor = await findUserRobustly(currentUplineTracker.sponsor_id);
                if (!sponsor) break;

                const eligible = await isUserEligible(sponsor._id);
                if (eligible) {
                    const commission = MILKISH_LEVELS[levelDistributed] * qty;
                    
                    sponsor.sponsor_income = (Number(sponsor.sponsor_income || 0)) + commission;
                    sponsor.total_income = (Number(sponsor.total_income || 0)) + commission;
                    await sponsor.save();

                    console.log(`Level ${levelDistributed + 1} Referral: ₹${commission} credited to ${sponsor.email}`);

                    // Create notification for sponsor
                    try {
                        const Notification = require('../models/Notification');
                        await Notification.create({
                            user_id: sponsor._id,
                            message: `You received Referral Income of ₹${commission.toFixed(2)} (Level ${levelDistributed + 1}) from ${buyer.full_name}'s purchase.`,
                            type: 'income',
                            path: '/referral-income'
                        });
                    } catch (err) {
                        console.error("Failed to create Milkish referral income notification:", err.message);
                    }

                    const Transaction = require('../models/Transaction');
                    await Transaction.create({
                        user: sponsor._id,
                        relatedUser: buyer._id,
                        type: 'referral_income',
                        amount: commission,
                        description: `Milkish Referral Income (Level ${levelDistributed + 1})`,
                        status: 'completed',
                        hash: `REF15K_${Date.now()}_L${levelDistributed + 1}`
                    });

                    const ReferralIncomes = require('../models/ReferralIncomes');
                    await ReferralIncomes.create({
                        earner_user_id: String(sponsor.user_id || sponsor._id),
                        referred_user_id: String(buyer.user_id || buyer._id),
                        product_id: String(productId),
                        product_transcation_id: txnId || `REF15K_${Date.now()}`,
                        amount: productAmount,
                        percentage: 0, // Fixed amount
                        referral_amount: commission,
                        status: 'credited'
                    });
                } else {
                    console.log(`Level ${levelDistributed + 1} Sponsor ${sponsor.email} is inactive/ineligible. Referral skipped.`);
                }

                levelDistributed++;
                currentUplineTracker = sponsor;
            }
        } else {
            // ORIGINAL LOGIC (1-level 8%) (Option 2: No shifting, check eligibility)
            console.log("Starting Standard 8% Referral Distribution (Option 2: No shifting, check eligibility).");
            let currentUplineTracker = buyer;
            let distributed = false;

            while (!distributed) {
                if (!currentUplineTracker.sponsor_id) break;

                let sponsor = await findUserRobustly(currentUplineTracker.sponsor_id);
                if (!sponsor) break;

                const eligible = await isUserEligible(sponsor._id);
                if (eligible) {
                    const referralIncome = (productAmount * 8) / 100;
                    sponsor.sponsor_income = (Number(sponsor.sponsor_income || 0)) + referralIncome;
                    sponsor.total_income = (Number(sponsor.total_income || 0)) + referralIncome;
                    await sponsor.save();

                    console.log(`8% Referral: ₹${referralIncome} credited to ${sponsor.email}`);

                    // Create notification for sponsor
                    try {
                        const Notification = require('../models/Notification');
                        await Notification.create({
                            user_id: sponsor._id,
                            message: `You received Referral Income of ₹${referralIncome.toFixed(2)} from ${buyer.full_name}'s purchase.`,
                            type: 'income',
                            path: '/referral-income'
                        });
                    } catch (err) {
                        console.error("Failed to create referral income notification:", err.message);
                    }

                    const Transaction = require('../models/Transaction');
                    await Transaction.create({
                        user: sponsor._id,
                        relatedUser: buyer._id,
                        type: 'referral_income',
                        amount: referralIncome,
                        description: `Referral Income (8%) from product purchase`,
                        status: 'completed',
                        hash: `REF${Date.now()}`
                    });

                    const ReferralIncomes = require('../models/ReferralIncomes');
                    await ReferralIncomes.create({
                        earner_user_id: String(sponsor.user_id || sponsor._id),
                        referred_user_id: String(buyer.user_id || buyer._id),
                        product_id: String(productId),
                        product_transcation_id: txnId || `REF${Date.now()}`,
                        amount: productAmount,
                        percentage: 8.00,
                        referral_amount: referralIncome,
                        status: 'credited'
                    });
                } else {
                    console.log(`Direct Sponsor ${sponsor.email} is inactive/ineligible. Referral skipped.`);
                }

                distributed = true;
                currentUplineTracker = sponsor;
            }
        }
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
