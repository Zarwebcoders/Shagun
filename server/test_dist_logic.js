const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const { distributeLevelIncome25 } = require('./utils/levelIncome25');
const User = require('./models/User');
const Product = require('./models/Product');
const MonthlyTokenDistribution = require('./models/MonthlyTokenDistribution');
const Setting = require('./models/Setting');

async function testDistribution() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Ensure a token price exists
        await Setting.findOneAndUpdate(
            { key: 'rexTokenPrice' },
            { value: 0.1 },
            { upsert: true }
        );
        console.log('Token Price set to 0.1');

        // 2. Find a test user (Dilip Gandhi)
        const user = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        // 3. Create a dummy product
        const dummyProduct = await Product.create({
            user_id: user.user_id || user.id,
            transcation_id: 'TEST_' + Date.now(),
            packag_type: 'Milkish Herbal',
            product_id: 1,
            token_value: 10000,
            amount: 11000,
            token_amount: 100000, // 10000 / 0.1
            approve: 1,
            quantity: 1,
            cereate_at: new Date()
        });
        console.log('Dummy product created:', dummyProduct._id);

        // 4. Run distribution
        console.log('Running distribution logic...');
        await distributeLevelIncome25(user._id, 10000, 1, dummyProduct._id);

        // 5. Verify records
        const dists = await MonthlyTokenDistribution.find({ from_purchase_id: dummyProduct._id });
        console.log(`Verified: Created ${dists.length} distribution records.`);
        
        if (dists.length > 0) {
            const first = dists[0];
            const second = dists.find(d => d.month_number === 2 && d.level === 0);
            if (second) {
                const diffDays = (second.scheduled_date - first.scheduled_date) / (1000 * 60 * 60 * 24);
                console.log(`Interval between installment 1 and 2: ${diffDays} days`);
            }
        }

        // Cleanup dummy data
        await Product.findByIdAndDelete(dummyProduct._id);
        await MonthlyTokenDistribution.deleteMany({ from_purchase_id: dummyProduct._id });
        console.log('Cleanup complete.');

        process.exit(0);
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

testDistribution();
