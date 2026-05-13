const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function syncReferralIncomes() {
    try {
        const User = require('../models/User');
        const Product = require('../models/Product');
        const ReferralIncomes = require('../models/ReferralIncomes');
        const { distributeReferralIncome } = require('../utils/levelIncome25');

        const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB. Syncing Referral Incomes...');

        // 1. Get all approved products
        const approvedProducts = await Product.find({
            $or: [{ approve: 1 }, { approve: '1' }]
        });

        console.log(`Checking ${approvedProducts.length} approved products for missing referral income...`);

        let syncCount = 0;

        for (const product of approvedProducts) {
            // Check if referral income already exists for this product
            const existing = await ReferralIncomes.findOne({ 
                product_id: String(product._id) 
            });

            if (!existing) {
                console.log(`Referral Income missing for Product ${product._id} (User: ${product.user_id}). Distributing...`);
                
                // Distribute 8% referral income
                // Note: distributeReferralIncome handles user lookup, sponsor lookup, balance update, and record creation
                await distributeReferralIncome(
                    product.user_id, 
                    product.amount * product.quantity, 
                    product._id, 
                    product.transcation_id
                );
                
                syncCount++;
            }
        }

        console.log(`\n--- SYNC COMPLETED ---`);
        console.log(`Total Products Synced: ${syncCount}`);
        process.exit(0);
    } catch (err) {
        console.error('Error during referral sync:', err);
        process.exit(1);
    }
}

syncReferralIncomes();
