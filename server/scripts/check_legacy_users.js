const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' }); // Assuming running from server/scripts

const User = require('../models/User');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected\n');

        const u = await User.countDocuments({});
        console.log('Total Users:', u);

        // Find users that have any shopping_tokens, real_tokens or package
        const uTokens = await User.countDocuments({
            $or: [
                { shopping_tokens: { $gt: 0 } },
                { real_tokens: { $gt: 0 } },
                { airdrop_tokens: { $gt: 0 } }
            ]
        });

        console.log('Users with tokens:', uTokens);

        // Sample user
        const sampleUser = await User.findOne({
            $or: [
                { shopping_tokens: { $gt: 0 } },
            ]
        });
        console.log('Sample user with tokens:', sampleUser);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
