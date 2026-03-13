const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const mainUser = await User.findOne({ email: 'blank@blank.com' }).lean();
        const sgn942 = await User.findOne({ user_id: 'SGN942' }).lean();

        console.log('Main User Referral ID:', mainUser.referral_id);
        console.log('SGN942 Sponsor ID:', sgn942.sponsor_id);
        console.log('Case Match:', mainUser.referral_id === sgn942.sponsor_id);

        console.log('\n--- Case Insensitive GraphLookup Simulation ---');
        const data = await User.aggregate([
            { $match: { _id: mainUser._id } },
            {
                $addFields: {
                    referral_id_lower: { $toLower: "$referral_id" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { ref_lower: "$referral_id_lower" },
                    pipeline: [
                        {
                            $addFields: {
                                sponsor_id_lower: { $toLower: "$sponsor_id" }
                            }
                        },
                        {
                            $match: {
                                $expr: { $eq: ["$sponsor_id_lower", "$$ref_lower"] }
                            }
                        }
                    ],
                    as: "level1"
                }
            }
        ]);

        if (data.length > 0) {
            console.log('Level 1 Members (Case Insensitive):', data[0].level1.length);
            data[0].level1.forEach(m => console.log(`- ${m.user_id} (${m.full_name}) | Sponsor ID: ${m.sponsor_id}`));
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
