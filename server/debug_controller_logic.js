const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const mainUser = await User.findOne({ email: 'blank@blank.com' }).lean();
        if (!mainUser) {
            console.log('User not found');
            process.exit(1);
        }

        console.log(`--- DEBUG FOR: ${mainUser.email} ---`);
        const queryId = mainUser.id || mainUser.user_id;
        console.log('queryId:', queryId);

        // 1. Fetch Incomes
        const incomes = await LevelIncome.find({ user_id: queryId, level: { $gt: 0 } })
            .sort({ created_at: -1 })
            .lean();
        console.log('Raw Incomes Count:', incomes.length);

        // 2. Map from users
        const fromIds = [...new Set(incomes.map(inc => inc.from_user_id).filter(id => id))];
        const fromUsers = await User.find({ id: { $in: fromIds } })
            .select('id full_name email user_id')
            .lean();

        const userMap = {};
        fromUsers.forEach(u => { userMap[u.id] = u; });

        const incomesWithDetails = incomes.map(inc => {
            const fromUser = userMap[inc.from_user_id];
            return {
                _id: inc._id,
                from_user_id: fromUser ? {
                    name: fromUser.full_name,
                    email: fromUser.email,
                    _id: fromUser._id
                } : { name: 'Unknown', email: '' }
            };
        });

        // 3. Fetch Network
        let networkMap = {};
        const downlineData = await User.aggregate([
            { $match: { _id: mainUser._id } },
            {
                $graphLookup: {
                    from: "users",
                    startWith: "$referral_id",
                    connectFromField: "referral_id",
                    connectToField: "sponsor_id",
                    as: "network",
                    maxDepth: 24,
                    depthField: "level_depth"
                }
            },
            {
                $project: { "network.id": 1, "network.full_name": 1, "network.email": 1, "network.level_depth": 1, "network._id": 1, "network.user_id": 1 }
            }
        ]);

        if (downlineData.length > 0 && downlineData[0].network) {
            console.log('Network Members Found:', downlineData[0].network.length);
            downlineData[0].network.forEach(netUser => {
                networkMap[netUser.id] = netUser;
                console.log(`- NetMember: ${netUser.user_id} (${netUser.full_name}), id: ${netUser.id}, _id: ${netUser._id}`);
            });
        }

        // 4. Combine
        const incomeUserIds = new Set(incomesWithDetails.map(inc => inc.from_user_id._id?.toString() || String(inc.from_user_id)));
        console.log('incomeUserIds count:', incomeUserIds.size);
        incomeUserIds.forEach(id => console.log('  - IncomeUID:', id));

        const finalIncomesList = [...incomesWithDetails];
        Object.values(networkMap).forEach(netUser => {
            const netUidStr = String(netUser._id);
            const alreadyIn = incomeUserIds.has(netUidStr);
            console.log(`Checking NetMember ${netUser.user_id} (${netUser.full_name}): _id=${netUidStr}, alreadyIn=${alreadyIn}`);
            if (!alreadyIn) {
                finalIncomesList.push({
                    from_user_id: { name: netUser.full_name, user_id: netUser.user_id }
                });
            }
        });

        console.log('Final List Size:', finalIncomesList.length);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
