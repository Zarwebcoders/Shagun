const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        console.log(`Searching for transaction 1222333...`);

        // Find by transaction ID using native mongo to bypass schema casts completely
        const pObj = await mongoose.connection.db.collection('products').findOne({
            $or: [
                { transcation_id: '1222333' },
                { w2_transaction_id: '1222333' },
                { transcation_id: 1222333 }
            ]
        });

        if (!pObj) {
            console.log("Product not found by transaction ID either.");

            // native
            const any110k = await mongoose.connection.db.collection('products').find({ amount: 110000 }).toArray();
            console.log(`\nFound ${any110k.length} products total with amount 110,000:`);
            for (const p of any110k) {
                console.log(` - ID: ${p._id} | Owner: ${p.user_id} | Date: ${p.cereate_at} | trans: ${p.transcation_id}`);
            }
            return;
        }

        console.log(`Found Product! ID: ${pObj._id}`);
        console.log(`  Owner user_id field: ${pObj.user_id}`);
        console.log(`  Amount: ${pObj.amount}`);
        console.log(`  Approved: ${pObj.approve} | Approvel: ${pObj.approvel}`);

        // See if user exists (SAFELY avoiding Mongoose cast throws)
        let matchedOwner = "Nobody";
        try {
            const rawUsers = await mongoose.connection.db.collection('users').find({
                $or: [{ id: pObj.user_id }, { user_id: pObj.user_id }]
            }).toArray();
            if (rawUsers.length > 0) {
                matchedOwner = `${rawUsers[0].full_name} (${rawUsers[0].user_id})`;
            }
        } catch (e) { }
        console.log(`  Mapped to User: ${matchedOwner}`);

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
