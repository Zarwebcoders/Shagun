const mongoose = require('mongoose');
const Product = require('../models/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkApprove = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const approveValues = await Product.aggregate([
            {
                $group: {
                    _id: "$approve",
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('--- Approve Values Summary ---');
        approveValues.forEach(v => {
            console.log(`Value: ${JSON.stringify(v._id)}, Type: ${typeof v._id}, Count: ${v.count}`);
        });

        // Specifically check for "Approved" (1 or '1')
        const totalApproved = await Product.countDocuments({
            $or: [
                { approve: 1 },
                { approve: "1" }
            ]
        });
        console.log(`\nTotal Approved (1 or "1"): ${totalApproved}`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkApprove();
