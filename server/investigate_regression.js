const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        console.log('--- USER DATA INVESTIGATION ---');
        
        const adminValues = await db.collection('users').distinct('is_admin');
        console.log('Unique is_admin values:', adminValues);

        const deletedValues = await db.collection('users').distinct('is_deleted');
        console.log('Unique is_deleted values:', deletedValues);

        const countSets = [
            { name: 'Total Raw', query: {} },
            { name: 'is_admin "0"', query: { is_admin: "0" } },
            { name: 'is_admin 0 (num)', query: { is_admin: 0 } },
            { name: 'is_admin "1"', query: { is_admin: "1" } },
            { name: 'is_admin 1 (num)', query: { is_admin: 1 } },
            { name: 'is_admin missing', query: { is_admin: { $exists: false } } },
            { name: 'is_deleted 0', query: { is_deleted: 0 } },
            { name: 'is_deleted missing', query: { is_deleted: { $exists: false } } },
            { name: 'is_deleted 1', query: { is_deleted: 1 } },
            { name: 'is_deleted "1"', query: { is_deleted: "1" } }
        ];

        for (const set of countSets) {
            const c = await db.collection('users').countDocuments(set.query);
            console.log(`${set.name}: ${c}`);
        }

        console.log('--- INVESTMENT DATA INVESTIGATION ---');
        const invCount = await db.collection('investments').countDocuments();
        console.log('Total Investments:', invCount);
        
        const invStatuses = await db.collection('investments').distinct('status');
        console.log('Investment Statuses:', invStatuses);

        if (invCount > 0) {
            const sampleInv = await db.collection('investments').findOne({});
            console.log('Sample Investment Status:', sampleInv.status);
            console.log('Sample Investment Keys:', Object.keys(sampleInv));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
阻
