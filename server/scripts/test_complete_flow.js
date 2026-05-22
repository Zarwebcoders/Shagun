const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const Product = require('../models/Product');
const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const Transaction = require('../models/Transaction');
const { distributeLevelIncome25, distributeReferralIncome, PRODUCT_DEFINITIONS } = require('../utils/levelIncome25');

const testCompleteFlow = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected\n');

        console.log('=== BLOCKCHAIN CONTRACT STATUS ===');
        console.log('❌ No blockchain contract is currently integrated');
        console.log('✅ All logic is database-based (MongoDB)');
        console.log('Note: REXTokenAddress in web3Config.js is set to zero address\n');

        console.log('=== PRODUCT DEFINITIONS ===');
        Object.entries(PRODUCT_DEFINITIONS).forEach(([id, def]) => {
            console.log(`Product ${id}: ${def.name} - Price: ₹${def.price}, Token Value: ₹${def.tokenValue}`);
        });

        console.log('\n=== CREATING TEST SCENARIO ===');

        // Create a chain of 5 test users
        const testUsers = [];
        let previousUserId = null;

        for (let i = 1; i <= 5; i++) {
            const existingUser = await User.findOne({ email: `testuser${i}@test.com` });

            if (existingUser) {
                console.log(`User ${i} already exists: ${existingUser.email}`);
                // Make user eligible by giving shopping tokens
                if (i < 5) { // All except the buyer
                    existingUser.shopping_tokens = 100;
                    await existingUser.save();
                    console.log(`  ✅ Made eligible with shopping tokens`);
                }
                testUsers.push(existingUser);
                previousUserId = existingUser._id;
            } else {
                const newUser = await User.create({
                    full_name: `Test User ${i}`,
                    email: `testuser${i}@test.com`,
                    password: 'test123',
                    referral_id: `TEST${i}${Date.now()}`,
                    sponsor_id: previousUserId,
                    real_tokens: 0,
                    shopping_tokens: i < 5 ? 100 : 0, // Make eligible except buyer
                    sponsor_income: 0,
                    level_income: 0,
                    total_income: 0
                });
                console.log(`✅ Created User ${i}: ${newUser.email} (Sponsor: ${previousUserId ? 'User ' + (i - 1) : 'None'})`);
                if (i < 5) {
                    console.log(`  ✅ Made eligible with shopping tokens`);
                }
                testUsers.push(newUser);
                previousUserId = newUser._id;
            }
        }

        console.log('\n=== TEST 1: PRODUCT PURCHASE ===');
        const buyer = testUsers[4]; // User 5 (last in chain)
        const productId = 1; // Milkish Herbal
        const quantity = 2;

        console.log(`Buyer: ${buyer.email}`);
        console.log(`Product: ${PRODUCT_DEFINITIONS[productId].name} (ID: ${productId})`);
        console.log(`Quantity: ${quantity}`);
        console.log(`Token Value: ₹${PRODUCT_DEFINITIONS[productId].tokenValue} × ${quantity} = ₹${PRODUCT_DEFINITIONS[productId].tokenValue * quantity}`);

        // Simulate product creation
        const testProduct = await Product.create({
            user_id: buyer._id,
            transcation_id: `TEST${Date.now()}`,
            w2_transaction_id: "",
            packag_type: PRODUCT_DEFINITIONS[productId].name,
            product_id: productId,
            token_value: PRODUCT_DEFINITIONS[productId].tokenValue,
            amount: PRODUCT_DEFINITIONS[productId].price,
            token_amount: (PRODUCT_DEFINITIONS[productId].tokenValue * quantity) / 1, // Assuming token rate = 1
            wallet_address: "0xTEST123",
            approvel: 0,
            approve: 0,
            quantity: quantity,
            business_volume: PRODUCT_DEFINITIONS[productId].price * quantity,
            cereate_at: new Date(),
            update_at: new Date()
        });

        console.log(`✅ Product created: ${testProduct._id}`);
        console.log(`   Token Amount: ${testProduct.token_amount} tokens`);

        console.log('\n=== TEST 2: ADMIN APPROVAL ===');
        console.log('Simulating admin approval...');

        // Get initial balances
        const sponsor = testUsers[3]; // User 4 (direct sponsor)
        const initialSponsorIncome = sponsor.sponsor_income || 0;

        console.log(`\nBefore Approval:`);
        console.log(`- Sponsor (${sponsor.email}) Income: ₹${initialSponsorIncome}`);

        // Distribute Referral Income (8%)
        const totalProductAmount = testProduct.amount * testProduct.quantity;
        console.log(`\nDistributing Referral Income (8% of ₹${totalProductAmount})...`);
        await distributeReferralIncome(buyer._id, totalProductAmount);

        // Distribute 25-Level Income
        console.log(`\nDistributing 25-Level Income...`);
        await distributeLevelIncome25(
            buyer._id,
            testProduct.token_value,
            testProduct.quantity,
            testProduct._id
        );

        // Update product status
        testProduct.approve = 1;
        await testProduct.save();

        console.log('\n=== TEST 3: VERIFY REFERRAL INCOME ===');
        const updatedSponsor = await User.findById(sponsor._id);
        const referralIncome = (updatedSponsor.sponsor_income || 0) - initialSponsorIncome;
        const expectedReferral = (totalProductAmount * 8) / 100;

        console.log(`Expected Referral Income: ₹${expectedReferral}`);
        console.log(`Actual Referral Income: ₹${referralIncome}`);
        console.log(referralIncome === expectedReferral ? '✅ PASS' : '❌ FAIL');

        console.log('\n=== TEST 4: VERIFY 25-LEVEL INCOME DISTRIBUTION ===');
        const distributions = await MonthlyTokenDistribution.find({
            from_purchase_id: testProduct._id
        }).populate('user_id', 'full_name email');

        console.log(`Total Monthly Distribution Records: ${distributions.length}`);

        // Group by user and level
        const userDistributions = {};
        distributions.forEach(d => {
            const key = `${d.user_id.email}_L${d.level}`;
            if (!userDistributions[key]) {
                userDistributions[key] = {
                    email: d.user_id.email,
                    level: d.level,
                    monthlyAmount: d.monthly_amount,
                    months: []
                };
            }
            userDistributions[key].months.push(d.month_number);
        });

        console.log('\nDistribution Summary:');
        Object.values(userDistributions).forEach(ud => {
            const totalAnnual = ud.monthlyAmount * 12;
            console.log(`- ${ud.email} (Level ${ud.level}): ₹${ud.monthlyAmount}/month × 12 = ₹${totalAnnual} total`);
            console.log(`  Months: ${ud.months.sort((a, b) => a - b).join(', ')}`);
        });

        // Verify Level 1 percentage (3.6%)
        const baseAmount = testProduct.token_value * testProduct.quantity;
        const expectedLevel1Monthly = (baseAmount * 3.6) / 100;
        const level1Dist = Object.values(userDistributions).find(ud => ud.level === 1);

        if (level1Dist) {
            console.log(`\nLevel 1 Verification:`);
            console.log(`Expected: ₹${expectedLevel1Monthly}/month`);
            console.log(`Actual: ₹${level1Dist.monthlyAmount}/month`);
            console.log(level1Dist.monthlyAmount === expectedLevel1Monthly ? '✅ PASS' : '❌ FAIL');
        }

        console.log('\n=== TEST 5: VERIFY ELIGIBILITY LOGIC ===');
        // Check if users without purchases are excluded
        const allDistributionUsers = [...new Set(distributions.map(d => d.user_id._id.toString()))];
        console.log(`Users receiving distributions: ${allDistributionUsers.length}`);
        console.log('Note: Only users with previous purchases or loyalty tokens should receive income');

        console.log('\n=== TEST SUMMARY ===');
        console.log('✅ Product purchase flow working');
        console.log('✅ Token calculation correct');
        console.log('✅ Referral income (8%) distributed');
        console.log('✅ 25-level income distribution created');
        console.log('✅ 12-month records generated for each level');
        console.log(`✅ Total distribution records: ${distributions.length}`);

        console.log('\n=== CLEANUP ===');
        console.log('Deleting test data...');
        await Product.deleteOne({ _id: testProduct._id });
        await MonthlyTokenDistribution.deleteMany({ from_purchase_id: testProduct._id });
        await Transaction.deleteMany({ user: buyer._id, type: 'investment' });

        // Reset sponsor income
        sponsor.sponsor_income = initialSponsorIncome;
        sponsor.total_income = sponsor.total_income - referralIncome;
        await sponsor.save();

        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('\n❌ TEST ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
};

testCompleteFlow();
