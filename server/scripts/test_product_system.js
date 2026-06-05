const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const Product = require('../models/Product');
const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const { PRODUCT_DEFINITIONS } = require('../utils/levelIncome25');

const testProductSystem = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected\n');

        // Test 1: Check Product Definitions
        console.log('=== Product Definitions ===');
        Object.entries(PRODUCT_DEFINITIONS).forEach(([id, def]) => {
            console.log(`Product ${id}: ${def.name} - Price: ₹${def.price}, Token Value: ₹${def.tokenValue}`);
        });

        // Test 2: Find a test user with sponsor
        console.log('\n=== Finding Test Users ===');
        const users = await User.find({}).limit(5).select('full_name email sponsor_id');
        console.log(`Found ${users.length} users`);
        users.forEach(u => {
            console.log(`- ${u.full_name} (${u.email}) - Sponsor: ${u.sponsor_id || 'None'}`);
        });

        // Test 3: Check existing products
        console.log('\n=== Existing Products ===');
        const products = await Product.find({}).limit(3).select('packag_type product_id token_value quantity approve');
        console.log(`Found ${products.length} products`);
        products.forEach(p => {
            console.log(`- ${p.packag_type} (ID: ${p.product_id || 'N/A'}) - Token Value: ₹${p.token_value || 'N/A'}, Qty: ${p.quantity}, Approved: ${p.approve}`);
        });

        // Test 4: Check monthly distributions
        console.log('\n=== Monthly Token Distributions ===');
        const distributions = await MonthlyTokenDistribution.find({}).limit(5);
        console.log(`Found ${distributions.length} monthly distributions`);
        distributions.forEach(d => {
            console.log(`- User: ${d.user_id}, Level: ${d.level}, Month: ${d.month_number}, Amount: ₹${d.monthly_amount}, Status: ${d.status}`);
        });

        console.log('\n=== Test Complete ===');
        console.log('\nTo test the full flow:');
        console.log('1. Create a product purchase with product_id (1-4)');
        console.log('2. Admin approves the product');
        console.log('3. Check MonthlyTokenDistribution collection for 12-month records');
        console.log('4. Use POST /api/monthly-tokens/process to credit monthly amounts');

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

testProductSystem();
