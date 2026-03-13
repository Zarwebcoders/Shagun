const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const u = await User.findOne({ email: 'blank@blank.com' });

        // Exact logic from controller
        const downlineData = await User.aggregate([
            { $match: { _id: u._id } },
            {
                $lookup: {
                    from: "users",
                    let: { ref_lower: { $toLower: "$referral_id" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [{ $toLower: "$sponsor_id" }, "$$ref_lower"]
                                }
                            }
                        }
                    ],
                    as: "network"
                }
            },
            {
                $project: { "network.id": 1, "network.full_name": 1, "network.email": 1, "network._id": 1, "network.user_id": 1 }
            }
        ]);

        console.log('--- FINAL VERIFICATION START ---');
        if (data = downlineData[0]) {
            console.log('Count:', data.network.length);
            data.network.forEach(n => {
                console.log(`USER: ${n.user_id} | NAME: ${n.full_name}`);
            });
        }
        console.log('--- FINAL VERIFICATION END ---');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
