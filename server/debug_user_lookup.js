const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const connectDB = require('./config/db');
const User = require('./models/User');
const Withdrawal = require('./models/Withdrawal');

dotenv.config();
connectDB();

const debugLookup = async () => {
    try {
        const targetId = "828";
        console.log(`Searching for User with ID: ${targetId}`);

        const userByUserId = await User.findOne({ user_id: targetId });
        console.log(`By user_id: ${userByUserId ? 'Found' : 'Not Found'}`);
        if (userByUserId) console.log(userByUserId.full_name);

        const userById = await User.findOne({ id: targetId });
        console.log(`By id: ${userById ? 'Found' : 'Not Found'}`);
        if (userById) console.log(userById.full_name);

        // Check Withdrawal data type for 'approve'
        const w = await Withdrawal.findOne({ user_id: targetId });
        if (w) {
            console.log(`Withdrawal approve type: ${typeof w.approve} value: ${w.approve}`);
        } else {
            console.log('No withdrawal found for this user_id');
        }

        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

debugLookup();
