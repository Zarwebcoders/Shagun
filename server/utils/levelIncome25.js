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
        // Check if user has any approved product purchase
        const hasPurchase = await Product.findOne({
            user_id: userId,
            approve: 1
        });

        if (hasPurchase) return true;

        // Check if user has loyalty/shopping tokens
        const user = await User.findById(userId);
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
        let currentUser = await User.findById(buyerUserId);

        if (!currentUser) {
            console.error(`Buyer user not found: ${buyerUserId}`);
            return;
        }

        // Get token rate from settings
        const Setting = require('../models/Setting');
        const tokenRateSetting = await Setting.findOne({ key: 'rexTokenPrice' });
        const tokenRate = tokenRateSetting ? Number(tokenRateSetting.value) : 1;

        console.log(`Starting 25-level distribution for product ${productId}, base amount: ₹${baseAmount}, token rate: ₹${tokenRate}`);

        // Traverse 25 levels
        for (let level = 0; level < 25; level++) {
            // Find sponsor
            if (!currentUser.sponsor_id) {
                console.log(`No more upline at level ${level + 1}`);
                break;
            }

            const uplineUser = await User.findById(currentUser.sponsor_id);

            if (!uplineUser) {
                console.warn(`Upline user not found: ${currentUser.sponsor_id}`);
                break;
            }

            // Check eligibility
            const eligible = await isUserEligible(uplineUser._id);

            if (eligible) {
                const monthlyPercentage = LEVEL_PERCENTAGES[level];

                // Calculate rupee amount first
                const monthlyRupeeAmount = (baseAmount * monthlyPercentage) / 100;

                // Convert to tokens: rupee_amount ÷ token_rate
                const monthlyTokenAmount = monthlyRupeeAmount / tokenRate;

                console.log(`Level ${level + 1}: ${uplineUser.email} - ${monthlyPercentage}% = ₹${monthlyRupeeAmount}/month = ${monthlyTokenAmount} tokens/month`);

                // Create 12 monthly distribution records
                const now = new Date();
                for (let month = 1; month <= 12; month++) {
                    const scheduledDate = new Date(now);
                    scheduledDate.setMonth(scheduledDate.getMonth() + month);

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
