const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Investment = require('./models/Investment');

dotenv.config();

async function run() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const totalFiltered = await User.countDocuments({ is_admin: "0", is_deleted: 0 });
        console.log('Current logic Total Users (filtered):', totalFiltered);

        const total = await User.countDocuments({});
        console.log('Total Users in DB:', total);

        // check is_deleted variations
        const deleted0 = await User.countDocuments({ is_deleted: 0 });
        const deletedNull = await User.countDocuments({ is_deleted: { $exists: false } });
        const deletedFalse = await User.countDocuments({ is_deleted: false });

        console.log('is_deleted stats:', { deleted0, deletedNull, deletedFalse });

        // check is_admin variations
        const admin0Str = await User.countDocuments({ is_admin: "0" });
        const admin0Num = await User.countDocuments({ is_admin: 0 });
        const admin0Null = await User.countDocuments({ is_admin: { $exists: false } });
        const admin1Str = await User.countDocuments({ is_admin: "1" });
        const admin1Num = await User.countDocuments({ is_admin: 1 });

        console.log('is_admin stats:', { admin0Str, admin0Num, admin0Null, admin1Str, admin1Num });

        // check active investments and users
        const activeInvestmentsCount = await Investment.countDocuments({ status: 'active' });
        console.log('Active Investments Total:', activeInvestmentsCount);

        const activeUsersResult = await Investment.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$user' } }
        ]);
        console.log('Unique users with active investments (raw array length):', activeUsersResult.length);

        if (activeUsersResult.length > 0) {
            const sampleId = activeUsersResult[0]._id;
            console.log('Sample user ID from active investment:', sampleId);
            
            // Try finding user by _id and by legacy id
            const userById = await User.findById(sampleId);
            console.log('User found by _id:', userById ? userById.email : 'NOT FOUND');
            
            const userByLegacyId = await User.findOne({ id: sampleId });
            console.log('User found by legacy string id:', userByLegacyId ? userByLegacyId.email : 'NOT FOUND');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
阻
