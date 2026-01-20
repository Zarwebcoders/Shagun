const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Investment = require('./models/Investment');
const Transaction = require('./models/Transaction');

dotenv.config();

const fixCommissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Find the admin user (or any user who needs fixing)
        // Adjust criteria if needed, e.g. find specific user ID if known, or run for ALL users
        const users = await User.find({});

        for (const user of users) {
            console.log(`Checking user: ${user.full_name} (${user._id})`);

            // 2. Find direct referrals (Level 1)
            const downlines = await User.find({ sponsor_id: user._id });

            if (downlines.length === 0) continue;

            console.log(`Found ${downlines.length} direct referrals.`);

            let expectedCommission = 0;
            let totalStats = [];

            // 3. Calculate expected commission from ACTIVE investments of referrals
            for (const referral of downlines) {
                const investments = await Investment.find({
                    user: referral._id,
                    status: 'active'
                });

                for (const inv of investments) {
                    // Level 1 commission is 5%
                    // Use businessVolume if available, else amount
                    const amount = inv.businessVolume !== undefined ? inv.businessVolume : inv.amount;
                    const comm = amount * 0.05;
                    expectedCommission += comm;
                    totalStats.push({ referral: referral._id, investmentAmount: amount, expected: comm });
                }
            }

            // 4. Calculate actual commission received
            const transactions = await Transaction.find({
                user: user._id,
                $or: [
                    { type: 'level_income', description: { $regex: /Level 1/ } },
                    { type: 'referral' }
                ]
            });

            const actualCommission = transactions.reduce((sum, t) => sum + t.amount, 0);

            console.log(`Expected: ${expectedCommission}, Actual: ${actualCommission}`);

            if (expectedCommission > actualCommission) {
                const diff = expectedCommission - actualCommission;
                console.log(`Missing ${diff} commission. Fixing...`);

                // Identify exactly which investment is missing commission is hard without strict linking,
                // but we can just create a "Reconciliation" transaction for the difference.
                // Or try to match 1-to-1.

                // Smart matching:
                // Map actual commissions to amounts
                const actualAmounts = transactions.map(t => t.amount);

                for (const item of totalStats) {
                    const idx = actualAmounts.indexOf(item.expected);
                    if (idx !== -1) {
                        // Matched
                        actualAmounts.splice(idx, 1);
                    } else {
                        // Missing!
                        console.log(`Creating missing commission of ${item.expected} for referral ${item.referral}`);

                        await Transaction.create({
                            user: user._id,
                            relatedUser: item.referral,
                            type: 'referral',
                            amount: item.expected,
                            description: `Referral Income from user ${item.referral} (Reconciled)`,
                            status: 'completed',
                            hash: `FIX${Date.now()}${Math.floor(Math.random() * 1000)}`
                        });

                        // Update user balance!
                        user.balance += item.expected;
                        await user.save();
                    }
                }
            } else {
                console.log("No missing commissions.");
            }
        }

        console.log('Done');
        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

fixCommissions();
