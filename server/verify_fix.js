const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const mainUser = await User.findOne({ email: 'blank@blank.com' });
        if (!mainUser) {
            console.log('User not found');
            process.exit(1);
        }

        console.log(`Verifying downline for: ${mainUser.email} (referral_id: ${mainUser.referral_id})`);

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
                $project: { "network.id": 1, "network.user_id": 1, "network.full_name": 1, "network.level_depth": 1, "network.sponsor_id": 1 }
            }
        ]);

        if (downlineData.length > 0 && downlineData[0].network) {
            const network = downlineData[0].network;
            console.log(`\nNetwork Members Found: ${network.length}`);

            const sgn942 = network.find(n => n.user_id === 'SGN942' || n.id === '945');
            if (sgn942) {
                console.log(`\nSUCCESS: SGN942 Found in downline!`);
                console.log(`- Name: ${sgn942.full_name}`);
                console.log(`- Level (0-based): ${sgn942.level_depth}`);
                console.log(`- Sponsor ID: ${sgn942.sponsor_id}`);
            } else {
                console.log(`\nFAILURE: SGN942 still not found in downline.`);
            }

            console.log('\nAll Level 1 members:');
            network.filter(n => n.level_depth === 0).forEach(n => {
                console.log(`- ${n.user_id} (${n.full_name}), Sponsor: ${n.sponsor_id}`);
            });
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
