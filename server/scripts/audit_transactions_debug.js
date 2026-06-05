const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function auditTransactions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const txs = await mongoose.connection.db.collection('transactions').find({}).toArray();
        console.log('--- ALL TRANSACTIONS ---');
        txs.forEach(t => {
            console.log(`ID: ${t._id} | User: ${t.user} | Type: ${t.type} | Status: ${t.status}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

auditTransactions();
