const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const connectDB = require('./config/db');
const Withdrawal = require('./models/Withdrawal');
const User = require('./models/User');

dotenv.config();
connectDB();

const debugWithdrawals = async () => {
    try {
        const withdrawals = await Withdrawal.find({}).populate('user_id');
        console.log(`Found ${withdrawals.length} withdrawals`.cyan);

        withdrawals.forEach((w, index) => {
            console.log(`\nWithdrawal ${index + 1}:`);
            console.log(`ID: ${w._id}`);
            console.log(`Amount: ${w.amount}`);
            console.log(`User ID (Raw): ${w.user_id ? (w.user_id._id || w.user_id) : 'null'}`);
            console.log(`User Name: ${w.user_id ? w.user_id.full_name : 'populate failed'}`);
        });

        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

debugWithdrawals();
