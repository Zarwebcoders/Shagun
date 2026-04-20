const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function auditWithdrawals() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("--- WITHDRAWAL AUDIT ---");
        const withdrawalStats = await mongoose.connection.db.collection('withdrawals').aggregate([
            { $group: { _id: "$approve", count: { $sum: 1 }, total: { $sum: { $toDouble: "$amount" } } } }
        ]).toArray();
        console.log("Withdrawal Stats:", JSON.stringify(withdrawalStats, null, 2));

        const totalTransactions = await mongoose.connection.db.collection('transactions').countDocuments({});
        console.log("Total Transactions:", totalTransactions);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

auditWithdrawals();
