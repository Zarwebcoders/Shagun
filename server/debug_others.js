const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const users = await User.find({ $or: [{ id: 'SGN043' }, { user_id: 'SGN043' }, { id: 'SGN768' }, { user_id: 'SGN768' }] });

        users.forEach(u => {
            console.log('USER_START');
            console.log('Name:', u.full_name);
            console.log('ID:', u.id);
            console.log('User_ID:', u.user_id);
            console.log('Sponsor_ID:', u.sponsor_id);
            console.log('USER_END');
        });

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
