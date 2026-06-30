const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

connectDB();

const createAdmin = async () => {
    try {
        // Check if darshan admin already exists
        const existing = await User.findOne({ email: 'darshan@shagun.com' });
        if (existing) {
            console.log('Admin darshan already exists!'.yellow.inverse);
            console.log(`Referral ID: ${existing.referral_id}`);
            process.exit(0);
        }

        const admin = await User.create({
            full_name: 'Darshan',
            email: 'darshan@shagun.com',
            mobile: '',
            password: 'darshan123',   // Will be hashed by pre-save hook
            plain_password: 'darshan123',
            is_admin: '1',
            referral_id: 'DARSHAN001',
            is_deleted: '0',
        });

        console.log('✅ Admin Darshan created successfully!'.green.inverse);
        console.log('----------------------------');
        console.log(`Name       : ${admin.full_name}`);
        console.log(`Email      : ${admin.email}`);
        console.log(`Password   : darshan123`);
        console.log(`Referral ID: ${admin.referral_id}`);
        console.log(`is_admin   : ${admin.is_admin}`);
        console.log('----------------------------');
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`.red.inverse);
        process.exit(1);
    }
};

createAdmin();
