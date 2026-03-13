const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('Normalizing referral_id and sponsor_id to uppercase...');
        const users = await User.find({});
        let updatedCount = 0;
        for (const user of users) {
            let changed = false;
            if (user.referral_id && user.referral_id !== user.referral_id.toUpperCase()) {
                user.referral_id = user.referral_id.toUpperCase();
                changed = true;
            }
            if (user.sponsor_id && user.sponsor_id !== user.sponsor_id.toUpperCase()) {
                user.sponsor_id = user.sponsor_id.toUpperCase();
                changed = true;
            }
            if (changed) {
                await user.save();
                updatedCount++;
            }
        }
        console.log(`Updated ${updatedCount} users.`);

        // Specific check for blank@blank.com downline after normalization
        const mainUser = await User.findOne({ email: 'blank@blank.com' });
        console.log(`Main User: ${mainUser.email} | Referral ID: ${mainUser.referral_id}`);

        const sgn942 = await User.findOne({ user_id: 'SGN942' });
        console.log(`SGN942 | Sponsor ID: ${sgn942.sponsor_id}`);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
