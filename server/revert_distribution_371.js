const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');
const ReferralIncomes = require('./models/ReferralIncomes');
const MonthlyTokenDistribution = require('./models/MonthlyTokenDistribution');
const Transaction = require('./models/Transaction');

const revert = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const productId = "6a16cf92e93417bff6716d92";
        const txId = "T2605171120392873033479";

        console.log('--- STARTING REVERSION FOR PRODUCT 371 ---');

        // 1. Referral Incomes
        const refIncomes = await ReferralIncomes.find({
            $or: [
                { product_id: productId },
                { product_transcation_id: txId }
            ]
        });

        console.log(`Found ${refIncomes.length} referral income entries to revert.`);
        for (const ref of refIncomes) {
            // Find sponsor/earner user
            const user = await User.findOne({
                $or: [
                    { user_id: ref.earner_user_id },
                    { id: ref.earner_user_id },
                    { referral_id: ref.earner_user_id }
                ]
            });

            if (user) {
                const amount = Number(ref.referral_amount || 0);
                user.sponsor_income = Math.max(0, (Number(user.sponsor_income || 0)) - amount);
                user.total_income = Math.max(0, (Number(user.total_income || 0)) - amount);
                await user.save();
                console.log(`Reverted Referral Income of ₹${amount} for user: ${user.email}`);
            }

            await ReferralIncomes.deleteOne({ _id: ref._id });
        }

        // 2. Level Incomes
        const levelIncomes = await LevelIncome.find({ product_id: productId });
        console.log(`Found ${levelIncomes.length} level income entries to revert.`);
        for (const lvl of levelIncomes) {
            const user = await User.findOne({
                $or: [
                    { id: lvl.user_id },
                    { user_id: lvl.user_id },
                    { referral_id: lvl.user_id }
                ]
            });

            if (user) {
                const amount = Number(lvl.amount || 0);
                user.level_income = Math.max(0, (Number(user.level_income || 0)) - amount);
                user.total_income = Math.max(0, (Number(user.total_income || 0)) - amount);
                await user.save();
                console.log(`Reverted Level Income of ${amount} tokens/INR for user: ${user.email}`);
            }

            await LevelIncome.deleteOne({ _id: lvl._id });
        }

        // 3. Monthly Token Distributions
        const monthlyDists = await MonthlyTokenDistribution.find({ from_purchase_id: productId });
        console.log(`Found ${monthlyDists.length} monthly token distribution entries to revert.`);
        for (const dist of monthlyDists) {
            // If any of them was already withdrawn or status is changed, we should handle it, but since this was just run, all should be pending.
            await MonthlyTokenDistribution.deleteOne({ _id: dist._id });
        }

        // 4. Transactions
        const txs = await Transaction.find({
            $or: [
                { hash: txId },
                { description: { $regex: txId, $options: 'i' } },
                { description: { $regex: 'Referral Income', $options: 'i' }, relatedUser: '69f5c18d43c3615196bae311' }, // Ayan's user id
                { type: 'referral_income', relatedUser: '69f5c18d43c3615196bae311' }
            ]
        });
        console.log(`Found ${txs.length} transactions to delete.`);
        for (const tx of txs) {
            await Transaction.deleteOne({ _id: tx._id });
        }

        console.log('--- REVERSION COMPLETED ---');
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

revert();
