const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        console.log('Connected.');

        console.log('\n--- Collection List ---');
        const collections = await db.listCollections().toArray();
        console.log(collections.map(c => c.name));

        console.log('\n--- User Field Distribution ---');
        const adminDist = await db.collection('users').aggregate([{ $group: { _id: '$is_admin', count: { $sum: 1 } } }]).toArray();
        console.log('is_admin:', JSON.stringify(adminDist));

        const deletedDist = await db.collection('users').aggregate([{ $group: { _id: '$is_deleted', count: { $sum: 1 } } }]).toArray();
        console.log('is_deleted:', JSON.stringify(deletedDist));

        console.log('\n--- Investment Status Distribution ---');
        const statusDist = await db.collection('investments').aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray();
        console.log('status:', JSON.stringify(statusDist));

        const sampleInv = await db.collection('investments').findOne({ status: 'active' });
        if (sampleInv) {
            console.log('\n--- Sample Active Investment ---');
            console.log(JSON.stringify(sampleInv, null, 2));
        } else {
            const anyInv = await db.collection('investments').findOne({});
            console.log('\n--- Sample Any Investment ---');
            console.log(JSON.stringify(anyInv, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
}
run();
阻
