const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const targetId = '697204fba8f83443dbf54176';
        console.log(`\n--- DEBUG START ---`);
        console.log(`Looking for User ID: ${targetId}`);

        // Method 1: findById
        try {
            const u1 = await User.findById(targetId);
            console.log(`Method 1 (findById): ${u1 ? 'FOUND: ' + u1.full_name : 'NOT FOUND'}`);
        } catch (e) {
            console.log('Method 1 Error:', e.message);
        }

        // Method 2: findOne with _id
        try {
            // Try casting to ObjectId manually
            const u2 = await User.findOne({ _id: new mongoose.Types.ObjectId(targetId) });
            console.log(`Method 2 (findOne ObjectId): ${u2 ? 'FOUND: ' + u2.full_name : 'NOT FOUND'}`);
        } catch (e) {
            console.log('Method 2 Error:', e.message);
        }

        // Method 3: Scan all users (String comparison)
        const allUsers = await User.find().select('_id full_name').lean();
        console.log(`Scanning ${allUsers.length} total users...`);
        const match = allUsers.find(u => String(u._id) === targetId);
        console.log(`Method 3 (Scan): ${match ? 'FOUND: ' + match.full_name : 'NOT FOUND'}`);

        console.log(`--- DEBUG END ---\n`);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
