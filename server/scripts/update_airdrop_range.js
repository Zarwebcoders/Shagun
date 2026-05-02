const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const updateAirdropRange = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const start = 91082;
        const end = 91132;
        const targetValue = 10;

        console.log(`Updating airdrop_tokons to ${targetValue} for referral IDs SGN${start} to SGN${end}...`);

        // Generate the list of SGN IDs
        const referralIds = [];
        for (let i = start; i <= end; i++) {
            referralIds.push(`SGN${i}`);
        }

        const result = await User.updateMany(
            { referral_id: { $in: referralIds } },
            { $set: { airdrop_tokons: targetValue } }
        );

        console.log(`Matched: ${result.matchedCount}`);
        console.log(`Modified: ${result.modifiedCount}`);

        await mongoose.connection.close();
        console.log('Done.');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateAirdropRange();
