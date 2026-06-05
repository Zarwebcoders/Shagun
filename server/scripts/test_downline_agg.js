const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function testDownline() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Let's test with Ripalkumar Doshi (user_id: SGN017, referral_id: SGN9017)
        // Or any user that has members. 
        const testUser = await User.findOne({ email: 'ripaldoshi48@gmail.com' });

        if (!testUser) {
            console.log('Test user not found');
            return;
        }
        console.log(`Testing downline for ${testUser.full_name} (referral_id: ${testUser.referral_id})`);

        const downline = await User.aggregate([
            { $match: { _id: testUser._id } },
            {
                $graphLookup: {
                    from: "users",
                    startWith: "$referral_id",
                    connectFromField: "referral_id",
                    connectToField: "sponsor_id",
                    as: "network",
                    maxDepth: 9,
                    depthField: "level"
                }
            },
            { $unwind: "$network" },
            {
                $replaceRoot: { newRoot: "$network" }
            }
        ]);

        console.log(`Found ${downline.length} downline members`);
        if (downline.length > 0) {
            console.log('Sample member:', downline[0].full_name, 'Level:', downline[0].level);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

testDownline();
