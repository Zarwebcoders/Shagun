const mongoose = require('mongoose');

const User = require('./models/User');
const Product = require('./models/Product');
const ReferralIncomes = require('./models/ReferralIncomes');
const LevelIncome = require('./models/LevelIncome');
const Transaction = require('./models/Transaction');
const Commission = require('./models/Commission');
const Wallet = require('./models/Wallet');

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

        if (!user) {
            console.log(`User with ID '${targetId}' was not found in database.`);
            await mongoose.disconnect();
            return;
        }

        console.log(`User found:`, {
            _id: user._id.toString(),
            full_name: user.full_name,
            email: user.email,
            referral_id: user.referral_id,
            user_id: user.user_id
        });

        const userIdentifiers = [
            user._id ? user._id.toString() : null,
            user.user_id,
            user.referral_id,
            user.id
        ].filter(Boolean);

        // Delete user
        const delUserRes = await User.deleteOne({ _id: user._id });
        console.log(`Deleted User record: ${delUserRes.deletedCount}`);

        // Delete products
        const delProdRes = await Product.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } },
                { referral_id: { $in: userIdentifiers } }
            ]
        });
        console.log(`Deleted Product records: ${delProdRes.deletedCount}`);

        // Delete level incomes
        const delLevelRes = await LevelIncome.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } },
                { referral_id: { $in: userIdentifiers } },
                { buyer_id: { $in: userIdentifiers } },
                { from_user_id: { $in: userIdentifiers } }
            ]
        });
        console.log(`Deleted LevelIncome records: ${delLevelRes.deletedCount}`);

        // Delete referral incomes
        const delRefRes = await ReferralIncomes.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } },
                { earner_user_id: { $in: userIdentifiers } },
                { buyer_id: { $in: userIdentifiers } },
                { referral_id: { $in: userIdentifiers } }
            ]
        });
        console.log(`Deleted ReferralIncomes records: ${delRefRes.deletedCount}`);

        // Delete transactions
        const delTxRes = await Transaction.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } },
                { referral_id: { $in: userIdentifiers } }
            ]
        });
        console.log(`Deleted Transaction records: ${delTxRes.deletedCount}`);

        // Delete commissions
        const delCommRes = await Commission.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } },
                { referral_id: { $in: userIdentifiers } },
                { from_user_id: { $in: userIdentifiers } }
            ]
        });
        console.log(`Deleted Commission records: ${delCommRes.deletedCount}`);

        // Delete wallet
        const delWalRes = await Wallet.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } }
            ]
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
