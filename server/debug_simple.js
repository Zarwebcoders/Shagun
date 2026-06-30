const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const mainUser = await User.findOne({ email: 'blank@blank.com' });
        if (mainUser) {
            console.log('MAIN_USER_START');
            console.log('Email:', mainUser.email);
            console.log('ID:', mainUser.id);
            console.log('User_ID:', mainUser.user_id);
            console.log('Referral_ID:', mainUser.referral_id);
            console.log('MAIN_USER_END');
        }

        const targetUser = await User.findOne({ $or: [{ id: 'SGN942' }, { user_id: 'SGN942' }, { referral_id: 'SGN942' }] });
        if (targetUser) {
            console.log('TARGET_USER_START');
            console.log('Full Name:', targetUser.full_name);
            console.log('ID:', targetUser.id);
            console.log('User_ID:', targetUser.user_id);
            console.log('Sponsor_ID:', targetUser.sponsor_id);
            console.log('TARGET_USER_END');
        }

        const allUsersCount = await User.countDocuments();
        console.log('Total Users:', allUsersCount);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
