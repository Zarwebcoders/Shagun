const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI.split('@')[1]); // Log part of URI safely
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');
        
        const db = mongoose.connection.db;
        const userCount = await db.collection('users').countDocuments({});
        console.log('User count directly from collection:', userCount);
        
        const investmentCount = await db.collection('investments').countDocuments({});
        console.log('Investment count directly from collection:', investmentCount);

        const adminStats = await db.collection('users').aggregate([
            { $group: { _id: '$is_admin', count: { $sum: 1 } } }
        ]).toArray();
        console.log('is_admin distribution:', JSON.stringify(adminStats, null, 2));

        const activeUsersCount = await db.collection('investments').aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$user' } },
            { $count: 'activeUsers' }
        ]).toArray();
        console.log('Active Users (count result):', JSON.stringify(activeUsersCount, null, 2));

        process.exit();
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}
run();
阻
