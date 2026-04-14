const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI missing');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        console.log('--- DB DIAGNOSTIC ---');
        
        const invCount = await db.collection('investments').countDocuments();
        console.log('Total Investments:', invCount);
        
        const invStatuses = await db.collection('investments').aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        console.log('Investment Statuses:', JSON.stringify(invStatuses, null, 2));

        const sampleInv = await db.collection('investments').findOne({});
        console.log('Sample Investment:', JSON.stringify(sampleInv, null, 2));

        const userCount = await db.collection('users').countDocuments();
        console.log('Total Users:', userCount);
        
        const activeUsersCount = await db.collection('investments').aggregate([
            { $match: { status: { $in: ['active', 'Active', 'approved', 'Approved', 1, '1'] } } },
            { $group: { _id: '$user' } },
            { $count: 'activeUsers' }
        ]).toArray();
        console.log('Test Active Users (Broad Query):', JSON.stringify(activeUsersCount, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('DIAGNOSTIC FAILED:', err);
        process.exit(1);
    }
}
run();
