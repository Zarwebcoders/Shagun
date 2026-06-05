const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        const investmentStatuses = await db.collection('investments').aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        console.log('Investment Statuses:', JSON.stringify(investmentStatuses, null, 2));

        const userAdmins = await db.collection('users').aggregate([
            { $group: { _id: '$is_admin', count: { $sum: 1 } } }
        ]).toArray();
        console.log('User is_admin distribution:', JSON.stringify(userAdmins, null, 2));

        const userDeleted = await db.collection('users').aggregate([
            { $group: { _id: '$is_deleted', count: { $sum: 1 } } }
        ]).toArray();
        console.log('User is_deleted distribution:', JSON.stringify(userDeleted, null, 2));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
阻
