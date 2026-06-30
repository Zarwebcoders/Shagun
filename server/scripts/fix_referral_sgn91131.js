const mongoose = require('mongoose');
const { distributeReferralIncome } = require('../utils/levelIncome25');
const Product = require('../models/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixReferral = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const buyerId = '1132'; // Pranith (SGN91132)
        const product = await Product.findOne({ user_id: buyerId });

        if (!product) {
            console.log('No product found for 1132');
            return;
        }

        console.log(`Found product: ${product.packag_type}, Amount: ${product.amount}, Status: ${product.approve}`);
        
        const totalAmount = product.amount * product.quantity;
        console.log(`Manually triggering distributeReferralIncome for user ${buyerId}, Total Amount: ${totalAmount}`);

        await distributeReferralIncome(buyerId, totalAmount, product._id, product.transcation_id);

        console.log('Manual distribution finished.');
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

fixReferral();
