const mongoose = require('mongoose');

const User = require('../models/User');
const Product = require('../models/Product');
const ReferralIncomes = require('../models/ReferralIncomes');
const LevelIncome = require('../models/LevelIncome');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');
const Wallet = require('../models/Wallet');

async function deleteTargetId(targetId) {
    let mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        try {
            require('dotenv').config();
            mongoUri = process.env.MONGO_URI;
        } catch (e) {}
    }

    if (!mongoUri) {
        console.error('MONGO_URI is missing. Please set MONGO_URI env variable.');
        process.exit(1);
    }

    try {
        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(mongoUri);
        console.log(`Searching for ID: ${targetId}...`);

        let queryCondition = {
            $or: [
                { user_id: targetId },
                { referral_id: targetId },
                { id: targetId }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(targetId)) {
            queryCondition.$or.push({ _id: targetId });
        }

        const user = await User.findOne(queryCondition);
        let userIdentifiers = [
            targetId,
            targetId.toLowerCase(),
            targetId.toUpperCase()
        ];

        if (!user) {
            console.log(`User document not found for '${targetId}'. Proceeding to delete any orphaned records matching this ID...`);
        } else {
            console.log(`User found:`, {
                _id: user._id.toString(),
                full_name: user.full_name,
                email: user.email,
                referral_id: user.referral_id,
                user_id: user.user_id
            });
            userIdentifiers.push(user._id ? user._id.toString() : null);
            userIdentifiers.push(user.user_id);
            userIdentifiers.push(user.referral_id);
            userIdentifiers.push(user.id);
            
            // Delete user
            const delUserRes = await User.deleteOne({ _id: user._id });
            console.log(`Deleted User record: ${delUserRes.deletedCount}`);
        }
        const uniqueUserIdentifiers = [...new Set(userIdentifiers.filter(Boolean))];
        const objectIdIdentifiers = uniqueUserIdentifiers.filter(id => mongoose.Types.ObjectId.isValid(id));

        // Delete products
        const delProdRes = await Product.deleteMany({
            user_id: { $in: uniqueUserIdentifiers }
        });
        console.log(`Deleted Product records: ${delProdRes.deletedCount}`);

        // Delete KYC
        const KYC = require('../models/KYC');
        const delKYCRes = await KYC.deleteMany({
            user_id: { $in: uniqueUserIdentifiers }
        });
        console.log(`Deleted KYC records: ${delKYCRes.deletedCount}`);

        // Delete level incomes
        const delLevelRes = await LevelIncome.deleteMany({
            $or: [
                { user_id: { $in: uniqueUserIdentifiers } },
                { referral_id: { $in: uniqueUserIdentifiers } },
                { buyer_id: { $in: uniqueUserIdentifiers } },
                { from_user_id: { $in: uniqueUserIdentifiers } }
            ]
        });
        console.log(`Deleted LevelIncome records: ${delLevelRes.deletedCount}`);

        // Delete referral incomes
        const delRefRes = await ReferralIncomes.deleteMany({
            $or: [
                { user_id: { $in: uniqueUserIdentifiers } },
                { earner_user_id: { $in: uniqueUserIdentifiers } },
                { referred_user_id: { $in: uniqueUserIdentifiers } },
                { buyer_id: { $in: uniqueUserIdentifiers } },
                { referral_id: { $in: uniqueUserIdentifiers } }
            ]
        });
        console.log(`Deleted ReferralIncomes records: ${delRefRes.deletedCount}`);

        // Delete transactions
        const delTxRes = await Transaction.deleteMany({
            $or: [
                { user: { $in: objectIdIdentifiers } },
                { relatedUser: { $in: objectIdIdentifiers } },
                { user_id: { $in: uniqueUserIdentifiers } },
                { referral_id: { $in: uniqueUserIdentifiers } }
            ]
        });
        console.log(`Deleted Transaction records: ${delTxRes.deletedCount}`);

        // Delete commissions
        const delCommRes = await Commission.deleteMany({
            $or: [
                { user_id: { $in: uniqueUserIdentifiers } },
                { referral_id: { $in: uniqueUserIdentifiers } },
                { from_user_id: { $in: uniqueUserIdentifiers } },
                { to_user_id: { $in: uniqueUserIdentifiers } }
            ]
        });
        console.log(`Deleted Commission records: ${delCommRes.deletedCount}`);

        // Delete MiningBonus
        const MiningBonus = require('../models/MiningBonus');
        const delMiningRes = await MiningBonus.deleteMany({
            user_id: { $in: uniqueUserIdentifiers }
        });
        console.log(`Deleted MiningBonus records: ${delMiningRes.deletedCount}`);

        // Delete MonthlyTokenDistribution
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
        const delDistRes = await MonthlyTokenDistribution.deleteMany({
            $or: [
                { user_id: { $in: objectIdIdentifiers } },
                { from_user_id: { $in: objectIdIdentifiers } }
            ]
        });
        console.log(`Deleted MonthlyTokenDistribution records: ${delDistRes.deletedCount}`);

        // Delete Withdrawal requests
        const Withdrawal = require('../models/Withdrawal');
        const delWithdrawRes = await Withdrawal.deleteMany({
            user_id: { $in: uniqueUserIdentifiers }
        });
        console.log(`Deleted Withdrawal records: ${delWithdrawRes.deletedCount}`);

        // Delete wallet
        const delWalRes = await Wallet.deleteMany({
            user_id: { $in: uniqueUserIdentifiers }
        });
        console.log(`Deleted Wallet records: ${delWalRes.deletedCount}`);

        console.log(`Successfully completed deletion for ${targetId}.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error during deletion:', err);
    }
}

const targetIdArg = process.argv[2] || 'SGN9991185';
deleteTargetId(targetIdArg);
