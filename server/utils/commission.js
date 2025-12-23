const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

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
            if (!currentUser.referredBy) {
                break; // No more upline
            }

            const uplineUser = await User.findById(currentUser.referredBy);

            if (!uplineUser) {
                console.warn(`Upline user not found for ID: ${currentUser.referredBy}`);
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
