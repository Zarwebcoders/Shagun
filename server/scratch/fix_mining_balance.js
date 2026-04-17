require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

async function migrateBalances() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Checking ${users.length} users...`);

        for (const user of users) {
            // Find all Level 0 distributions for this user
            const distributions = await MonthlyTokenDistribution.find({
                user_id: user._id,
                level: 0
            });

            if (distributions.length > 0) {
                const totalROI = distributions.reduce((sum, d) => sum + d.monthly_amount, 0);
                
                // For safety, only migrate if level_income has enough balance
                // Actually, just move whatever we found in distributions to mining_bonus
                // and subtract from level_income (clamping at 0)
                
                const originalLevelIncome = Number(user.level_income || 0);
                const amountToMove = Math.min(originalLevelIncome, totalROI);

                if (amountToMove > 0) {
                    user.level_income = originalLevelIncome - amountToMove;
                    user.mining_bonus = (Number(user.mining_bonus || 0)) + amountToMove;
                    
                    await user.save();
                    console.log(`Migrated ${amountToMove.toFixed(2)} SGN for ${user.email} (ROI moved to Mining Bonus)`);
                }
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateBalances();
