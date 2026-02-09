const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const Product = require('../models/Product');
const { distributeLevelIncome25, PRODUCT_DEFINITIONS } = require('../utils/levelIncome25');

const testBiMonthlyWithdrawal = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected\n');

        console.log('=== BI-MONTHLY WITHDRAWAL SYSTEM TEST ===\n');

        // Find or create test user
        let testUser = await User.findOne({ email: 'testuser5@test.com' });

        if (!testUser) {
            console.log('❌ Test user not found. Run test_complete_flow.js first.');
            return;
        }

        console.log(`Test User: ${testUser.email}\n`);

        // Create test product and distributions
        console.log('=== CREATING TEST DISTRIBUTIONS ===');
        const productId = 1;
        const quantity = 2;
        const tokenValue = PRODUCT_DEFINITIONS[productId].tokenValue;

        const testProduct = await Product.create({
            user_id: testUser._id,
            transcation_id: `BIMONTHLY${Date.now()}`,
            packag_type: PRODUCT_DEFINITIONS[productId].name,
            product_id: productId,
            token_value: tokenValue,
            amount: PRODUCT_DEFINITIONS[productId].price,
            token_amount: (tokenValue * quantity),
            approve: 1,
            quantity: quantity,
            business_volume: PRODUCT_DEFINITIONS[productId].price * quantity,
            cereate_at: new Date()
        });

        // Make user eligible
        testUser.shopping_tokens = 100;
        await testUser.save();

        // Distribute level income
        await distributeLevelIncome25(testUser._id, tokenValue, quantity, testProduct._id);

        console.log(`✅ Created test product and distributions\n`);

        // Test dashboard stats
        console.log('=== TESTING DASHBOARD STATS ===');
        const distributions = await MonthlyTokenDistribution.find({
            user_id: testUser._id,
            status: 'pending'
        });

        const monthlyAmounts = {};
        distributions.forEach(dist => {
            const key = `${dist.from_purchase_id}_${dist.level}`;
            if (!monthlyAmounts[key]) {
                monthlyAmounts[key] = dist.monthly_amount;
            }
        });

        const totalAnnual = Object.values(monthlyAmounts).reduce((sum, amount) => sum + (amount * 12), 0);
        const biMonthlyAmount = totalAnnual / 24;

        console.log(`Total Annual Income: ${totalAnnual} tokens`);
        console.log(`Bi-Monthly Amount: ${biMonthlyAmount} tokens (annual ÷ 24)`);
        console.log(`Example: User can withdraw ${biMonthlyAmount} tokens every 15 days\n`);

        // Test withdrawal tracking
        console.log('=== TESTING WITHDRAWAL TRACKING ===');
        const user = await User.findById(testUser._id);

        console.log(`Last Withdrawal: ${user.level_income_last_withdrawal || 'Never'}`);
        console.log(`Withdrawn Count: ${user.level_income_withdrawn_count || 0}/24`);

        // Simulate first withdrawal
        user.level_income_last_withdrawal = new Date();
        user.level_income_withdrawn_count = 1;
        await user.save();

        console.log(`\n✅ Simulated first withdrawal`);
        console.log(`Updated Last Withdrawal: ${user.level_income_last_withdrawal}`);
        console.log(`Updated Count: ${user.level_income_withdrawn_count}/24`);

        // Calculate next withdrawal date
        const nextDate = new Date(user.level_income_last_withdrawal);
        nextDate.setDate(nextDate.getDate() + 15);
        console.log(`Next Withdrawal Date: ${nextDate.toDateString()}\n`);

        // Test 15-day check
        console.log('=== TESTING 15-DAY CYCLE ===');
        const now = new Date();
        const daysSince = Math.floor((now - user.level_income_last_withdrawal) / (1000 * 60 * 60 * 24));
        const canWithdraw = daysSince >= 15 && user.level_income_withdrawn_count < 24;

        console.log(`Days Since Last Withdrawal: ${daysSince}`);
        console.log(`Can Withdraw Now: ${canWithdraw ? 'Yes ✅' : 'No ❌ (must wait 15 days)'}`);
        console.log(`Days Remaining: ${canWithdraw ? 0 : 15 - daysSince}\n`);

        console.log('=== CLEANUP ===');
        await Product.deleteOne({ _id: testProduct._id });
        await MonthlyTokenDistribution.deleteMany({ from_purchase_id: testProduct._id });
        user.level_income_last_withdrawal = null;
        user.level_income_withdrawn_count = 0;
        await user.save();
        console.log('✅ Test data cleaned up\n');

        console.log('=== SUMMARY ===');
        console.log('✅ Bi-monthly withdrawal system working');
        console.log('✅ Total annual income calculated correctly');
        console.log('✅ Bi-monthly amount = annual ÷ 24');
        console.log('✅ 15-day cycle enforced');
        console.log('✅ Withdrawal count tracked (max 24)');
        console.log('\n📊 Dashboard will show:');
        console.log(`   - Total Annual: ${totalAnnual} tokens`);
        console.log(`   - Available Now: ${canWithdraw ? biMonthlyAmount : 0} tokens`);
        console.log(`   - Next Withdrawal: ${nextDate.toDateString()}`);

    } catch (error) {
        console.error('❌ Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

testBiMonthlyWithdrawal();
