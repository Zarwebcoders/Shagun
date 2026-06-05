const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

async function run() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI is missing');
        
        console.log('Connecting...');
        await mongoose.connect(uri);
        console.log('Connected.');

        const db = mongoose.connection.db;

        // Check one investment to see structure and values
        const sampleInv = await db.collection('investments').findOne({});
        console.log('Sample Investment:', JSON.stringify(sampleInv, null, 2));

        // Get all unique statuses in investments
        const invStatuses = await db.collection('investments').distinct('status');
        console.log('Investment Statuses:', invStatuses);

        // Check one user to see structure
        const sampleUser = await db.collection('users').findOne({ is_admin: { $ne: "1" } });
        console.log('Sample User:', JSON.stringify(sampleUser, null, 2));

        // check is_deleted values
        const deletedValues = await db.collection('users').distinct('is_deleted');
        console.log('is_deleted unique values:', deletedValues);

        process.exit(0);
    } catch (err) {
        console.error('DIAGNOSTIC FAILED:', err.message);
        process.exit(1);
    }
}
run();
阻
