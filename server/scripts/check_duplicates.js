const mongoose = require('mongoose');
const ReferralIncome = require('../models/ReferralIncomes');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const duplicates = await ReferralIncome.aggregate([
            {
                $group: {
                    _id: { product_id: "$product_id", earner_user_id: "$earner_user_id" },
                    count: { $sum: 1 },
                    docs: { $push: "$_id" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 },
                    "_id.product_id": { $ne: null }
                }
            }
        ]);

        console.log(`Found ${duplicates.length} duplicate groups.`);

        for (const group of duplicates) {
            console.log(`\nProduct ID: ${group._id.product_id}, Earner: ${group._id.earner_user_id}`);
            console.log(`Count: ${group.count}`);
            // console.log(`Doc IDs: ${group.docs.join(', ')}`);
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkDuplicates();
