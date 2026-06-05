const mongoose = require('mongoose');
const User = require('./server/models/User');
const Investment = require('./server/models/Investment');

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/shagun');
        console.log('Connected to MongoDB');

        const total = await User.countDocuments({});
        console.log('Total Users in DB:', total);

        const adminStats = await User.aggregate([
            { $group: { _id: '$is_admin', count: { $sum: 1 } } }
        ]);
        console.log('is_admin distribution:', JSON.stringify(adminStats, null, 2));

        const deletedStats = await User.aggregate([
            { $group: { _id: '$is_deleted', count: { $sum: 1 } } }
        ]);
        console.log('is_deleted distribution:', JSON.stringify(deletedStats, null, 2));

        const activeInvestments = await Investment.countDocuments({ status: 'active' });
        console.log('Active Investments:', activeInvestments);

        const activeUsersResult = await Investment.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$user' } },
            { $count: 'activeUsers' }
        ]);
        console.log('Active Users (count result):', JSON.stringify(activeUsersResult, null, 2));

        if (activeUsersResult.length === 0) {
            console.log('Sample Investment:', await Investment.findOne({ status: 'active' }));
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
