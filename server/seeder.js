const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await User.deleteMany();

        const createdUser = await User.create([
            {
                full_name: 'Admin User',
                email: 'admin@rextoken.com',
                password: 'admin123', // Will be hashed by pre-save hook
                is_admin: 1,
                referral_id: 'ADM1001'
            },
            {
                full_name: 'John Doe',
                email: 'user@example.com',
                password: 'password123',
                is_admin: 0,
                referral_id: 'JOH1002'
            },
        ]);

        console.log('Data Imported!'.green.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany();

        console.log('Data Destroyed!'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
