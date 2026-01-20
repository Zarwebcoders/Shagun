const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ReferralIncomes = require('../models/ReferralIncomes');
const LevelIncome = require('../models/LevelIncome');
const Commission = require('../models/Commission');

/**
 * Distributes level income to upline users based on the investment amount.
 * 
 * Levels & Percentages:
 * 1. 5%
 * 2. 2%
 * 3. 1.5%
 * 4. 1%
 * 5. 1%
 * 6. 1%
 * 7. 0.75%
 * 8. 0.50%
 * 9. 0.25%
 * 10. 0.25%
 * 
 * @param {string} userId - The ID of the user who invested
 * @param {number} amount - The investment amount
 * @param {string} transactionId - The transaction hash/ID of the investment
 */
const distributeLevelIncome = async (userId, amount, transactionId) => {
    try {
        const percentages = [5, 2, 1.5, 1, 1, 1, 0.75, 0.50, 0.25, 0.25];
        let currentUser = await User.findById(userId);

        if (!currentUser) {
            console.error(`User not found for ID: ${userId}`);
            return;
        }

        // Loop through 10 levels
        for (let i = 0; i < percentages.length; i++) {
            // Find referrer
            if (!currentUser.sponsor_id) {
                break; // No more upline
            }

            const uplineUser = await User.findById(currentUser.sponsor_id);

            if (!uplineUser) {
                console.warn(`Upline user not found for ID: ${currentUser.sponsor_id}`);
                break;
            }

            // Calculate commission
            const commissionAmount = (amount * percentages[i]) / 100;

            if (commissionAmount > 0) {
                // Add to upline user's balance
                uplineUser.balance += commissionAmount;
                await uplineUser.save();

                // Create Transaction Record
                await Transaction.create({
                    user: uplineUser._id,
                    relatedUser: userId, // Shows who caused this commission
                    type: i === 0 ? 'referral' : 'level_income',
                    amount: commissionAmount,
                    description: i === 0
                        ? `Referral Income from user ${userId}`
                        : `Level ${i + 1} Income from user ${userId}`,
                    status: 'completed',
                    hash: `COM${Date.now()}${Math.floor(Math.random() * 1000)}`
                });

                // Create Referral Income Record
                await ReferralIncomes.create({
                    earner_user_id: uplineUser._id, // User ID (ObjectId/String)
                    referred_user_id: userId,
                    product_transcation_id: transactionId,
                    amount: amount, // Base Investment Amount
                    percentage: percentages[i],
                    referral_amount: commissionAmount, // Calculated Commission
                    status: 'credited',
                    create_at: new Date()
                });

                // Create Level Income Record (Keeping for backward compatibility if needed, or user can remove)
                await LevelIncome.create({
                    user_id: uplineUser._id,
                    from_user_id: userId,
                    level: i + 1,
                    amount: commissionAmount,
                    created_at: new Date(),
                    product_id: transactionId
                });

                // Create Commission Record (New Structure)
                await Commission.create({
                    from_user_id: userId,
                    to_user_id: uplineUser._id,
                    level: i + 1,
                    percentage: percentages[i],
                    amount: commissionAmount,
                    stake_amount: amount, // The investment amount
                    tx_hash: transactionId,
                    created_at: new Date()
                });

                console.log(`Distributed Level ${i + 1} income (${commissionAmount}) to ${uplineUser.email}`);
            }

            // Move up to the next level
            currentUser = uplineUser;
        }

    } catch (error) {
        console.error("Error distributing level income:", error);
    }
};

module.exports = {
    distributeLevelIncome
};
