const mongoose = require('mongoose');
const User = require('./models/User.js');

mongoose.connect('mongodb://127.0.0.1:27017/shagun')
    .then(async () => {
        console.log('Connected');
        // Let's find ANY user who has a downline
        const anyUser = await User.findOne({ sponsor_id: { $exists: true, $ne: null } });
        if (!anyUser) return;

        let targetId = anyUser.sponsor_id;
        let sponsorUser;
        if (mongoose.Types.ObjectId.isValid(targetId)) {
            sponsorUser = await User.findById(targetId);
        } else {
            sponsorUser = await User.findOne({ id: targetId });
        }

        if (!sponsorUser) {
            console.log('Sponsor not found for id', targetId);
            process.exit(0);
        }

        console.log('Testing for top sponsor:', sponsorUser.email, sponsorUser.id);

        const pipeline = [
            { $match: { _id: sponsorUser._id } },
            {
                $graphLookup: {
                    from: "users",
                    startWith: "$id",
                    connectFromField: "id",
                    connectToField: "sponsor_id",
                    as: "network",
                    maxDepth: 24, // 0 to 24 = 25 levels
                    depthField: "level"
                }
            }
        ];

        console.time('graphLookup');
        const result = await User.aggregate(pipeline);
        console.timeEnd('graphLookup');

        if (result.length > 0 && result[0].network) {
            console.log('Network size:', result[0].network.length);
            const levelCounts = {};
            result[0].network.forEach(u => {
                const lvl = u.level + 1;
                levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
            });
            console.log('Levels:', levelCounts);
        }
        process.exit(0);
    })
    .catch(console.error);
