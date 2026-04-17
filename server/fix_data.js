require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

async function fixData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Fix Sponsor SGN9001 income
        const sponsor = await User.findOne({ referral_id: 'SGN9001' });
        if (sponsor) {
            console.log('Current Sponsor Income:', sponsor.sponsor_income);
            // If it's a string looking like concatenated values, fix it
            if (String(sponsor.sponsor_income).includes('6280880')) {
                 sponsor.sponsor_income = 7160; 
                 sponsor.total_income = 7160;
                 await sponsor.save();
                 console.log('Fixed Sponsor Income to 7160');
            }
        }

        // 2. Reset Buyer SGN1070 for re-test
        const buyer = await User.findOne({ email: 'test_user_7@example.com' });
        if (buyer) {
            buyer.level_income = 0;
            buyer.total_income = 0;
            buyer.mining_bonus = 0;
            buyer.total_mining_count = 0;
            buyer.mining_count_thismounth = "0";
            await buyer.save();
            console.log('Reset Buyer stats');
        }

        // 3. Reset Product
        const product = await Product.findOne({ transcation_id: 'TXN123456' });
        if (product) {
            product.approve = 0;
            product.daily_return_amount = 10; // Add reward for test
            await product.save();
            console.log('Reset Product status to PENDING and set reward to 10');
        }
        
        // 4. Delete existing LevelIncome records for this product to avoid duplicates
        const LevelIncome = require('./models/LevelIncome');
        const MonthlyDist = require('./models/MonthlyTokenDistribution');
        await LevelIncome.deleteMany({ product_id: product._id });
        await MonthlyDist.deleteMany({ from_purchase_id: product._id });
        console.log('Cleared income records for clean re-test');

        process.exit(0);
    } catch (err) {
        console.error('Error during data fix:', err);
        process.exit(1);
    }
}

fixData();
