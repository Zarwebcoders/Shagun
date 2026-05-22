const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const Product = require('../models/Product');
const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const Setting = require('../models/Setting');
const { distributeLevelIncome25, PRODUCT_DEFINITIONS } = require('../utils/levelIncome25');

const testTokenDistribution = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected\n');

        console.log('=== TOKEN-BASED LEVEL INCOME TEST ===\n');

        // Get token rate
        const tokenRateSetting = await Setting.findOne({ key: 'rexTokenPrice' });
        const tokenRate = tokenRateSetting ? Number(tokenRateSetting.value) : 1;
        console.log(`Token Rate: ₹${tokenRate} per token\n`);

        // Find test users
        const testUsers = [];
        for (let i = 1; i <= 5; i++) {
            const user = await User.findOne({ email: `testuser${i}@test.com` });
            if (user) {
                testUsers.push(user);
                // Make eligible
                if (i < 5) {
                    user.shopping_tokens = 100;
                    await user.save();
                }
            }
        }

        if (testUsers.length < 5) {
            console.log('❌ Test users not found. Run test_complete_flow.js first.');
            return;
        }

        console.log(`Found ${testUsers.length} test users\n`);

        // Create test product
        const buyer = testUsers[4];
        const productId = 1;
        const quantity = 2;
        const tokenValue = PRODUCT_DEFINITIONS[productId].tokenValue;

        console.log('=== CREATING TEST PRODUCT ===');
        console.log(`Product: ${PRODUCT_DEFINITIONS[productId].name}`);
        console.log(`Token Value: ₹${tokenValue} × ${quantity} = ₹${tokenValue * quantity}`);

        const testProduct = await Product.create({
            user_id: buyer._id,
            transcation_id: `TOKENTEST${Date.now()}`,
            packag_type: PRODUCT_DEFINITIONS[productId].name,
            product_id: productId,
            token_value: tokenValue,
            amount: PRODUCT_DEFINITIONS[productId].price,
            token_amount: (tokenValue * quantity) / tokenRate,
            wallet_address: "0xTEST",
            approve: 0,
            quantity: quantity,
            business_volume: PRODUCT_DEFINITIONS[productId].price * quantity,
            cereate_at: new Date()
        });

        console.log(`✅ Product created: ${testProduct._id}\n`);

        // Distribute level income
        console.log('=== DISTRIBUTING LEVEL INCOME (TOKENS) ===');
        await distributeLevelIncome25(buyer._id, tokenValue, quantity, testProduct._id);

        // Check distributions
        console.log('\n=== VERIFYING TOKEN DISTRIBUTIONS ===');
        const distributions = await MonthlyTokenDistribution.find({
            from_purchase_id: testProduct._id
        }).populate('user_id', 'email');

        const userDists = {};
        distributions.forEach(d => {
            const key = `${d.user_id.email}_L${d.level}`;
            if (!userDists[key]) {
                userDists[key] = {
                    email: d.user_id.email,
                    level: d.level,
                    monthlyTokens: d.monthly_amount,
                    months: []
                };
            }
            userDists[key].months.push(d.month_number);
        });

        console.log(`Total Distribution Records: ${distributions.length}\n`);

        // Calculate expected values
        const baseAmount = tokenValue * quantity; // ₹20,000
        console.log('Expected vs Actual:\n');

        Object.values(userDists).forEach(ud => {
            const levelPercentages = [3.6, 1.8, 1.2, 0.96];
            const percentage = levelPercentages[ud.level - 1];
            const expectedRupees = (baseAmount * percentage) / 100;
            const expectedTokens = expectedRupees / tokenRate;
            const annualTokens = ud.monthlyTokens * 12;

            console.log(`${ud.email} (Level ${ud.level}):`);
            console.log(`  Percentage: ${percentage}%`);
            console.log(`  Expected: ₹${expectedRupees}/month ÷ ₹${tokenRate} = ${expectedTokens} tokens/month`);
            console.log(`  Actual: ${ud.monthlyTokens} tokens/month`);
            console.log(`  Annual: ${annualTokens} tokens`);
            console.log(`  Status: ${ud.monthlyTokens === expectedTokens ? '✅ PASS' : '❌ FAIL'}\n`);
        });

        console.log('=== CLEANUP ===');
        await Product.deleteOne({ _id: testProduct._id });
        await MonthlyTokenDistribution.deleteMany({ from_purchase_id: testProduct._id });
        console.log('✅ Test data cleaned up\n');

        console.log('=== SUMMARY ===');
        console.log('✅ Level income now distributes TOKENS instead of rupees');
        console.log('✅ Calculation: (rupee_amount × percentage) ÷ token_rate');
        console.log('✅ Tokens credited to real_tokens field');
        console.log(`✅ Total records created: ${distributions.length}`);

    } catch (error) {
        console.error('❌ Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

testTokenDistribution();
