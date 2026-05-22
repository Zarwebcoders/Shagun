const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');

async function syncBalances() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Syncing user balances...');

    const users = await User.find({});
    for (const user of users) {
        const queryId = user.id || user.user_id;
        
        // Sum all Level Income records (Level 1-25)
        const incomes = await LevelIncome.find({ user_id: queryId, level: { $gt: 0 } });
        const totalLevelIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

        // Sum Mining Bonus (Level 0)
        const miningIncomes = await LevelIncome.find({ user_id: queryId, level: 0 });
        const totalMiningBonus = miningIncomes.reduce((sum, inc) => sum + inc.amount, 0);

        const totalIncome = totalLevelIncome + totalMiningBonus;

        if (user.level_income !== totalLevelIncome || user.mining_bonus !== totalMiningBonus) {
            console.log(`Updating User ${user.email || user.referral_id}: 
              Level Income: ${user.level_income} -> ${totalLevelIncome}
              Mining Bonus: ${user.mining_bonus} -> ${totalMiningBonus}
            `);
            await User.updateOne({ _id: user._id }, { 
                $set: { 
                    level_income: totalLevelIncome,
                    mining_bonus: totalMiningBonus,
                    total_income: totalIncome
                } 
            });
        }
    }

    console.log('Balance synchronization complete.');
    process.exit();
}

syncBalances().catch(console.error);
