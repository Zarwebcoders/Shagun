const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const LevelIncome = require('./models/LevelIncome');
const { distributeLevelIncome25 } = require('./utils/levelIncome25');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- INCOME RECOVERY START ---');

        const mainUser = await User.findOne({ email: 'blank@blank.com' }).lean();
        if (!mainUser) {
            console.error('Main user blank@blank.com not found');
            process.exit(1);
        }

        const referralId = mainUser.referral_id.toUpperCase();
        console.log(`Recovery for: ${mainUser.full_name} (${referralId})`);

        // Find all Level 1 members (case-insensitive sponsor match)
        const members = await User.find({
            sponsor_id: { $regex: new RegExp(`^${referralId}$`, 'i') }
        }).lean();

        console.log(`Found ${members.length} Level 1 members.`);

        let recoveredCount = 0;

        for (const member of members) {
            console.log(`\nProcessing Member: ${member.full_name} (${member.user_id})`);

            // Find all approved products for this member
            const products = await Product.find({
                $and: [
                    {
                        $or: [
                            { user_id: member._id },
                            { user_id: String(member._id) },
                            { user_id: member.id },
                            { user_id: member.user_id }
                        ]
                    },
                    {
                        $or: [
                            { approve: '1' },
                            { approve: 1 }
                        ]
                    }
                ]
            }).lean();

            console.log(`- Found ${products.length} approved products.`);

            for (const product of products) {
                // Check if Level 1 income already exists for blank@blank.com for this product
                const existingIncome = await LevelIncome.findOne({
                    user_id: mainUser.id || mainUser.user_id,
                    from_user_id: member.id || member.user_id,
                    product_id: product._id,
                    level: 1
                });

                if (existingIncome) {
                    console.log(`  - Product ${product.transcation_id}: Income already exists (₹${existingIncome.amount}). Skipping.`);
                } else {
                    console.log(`  - Product ${product.transcation_id}: Income missing. Attempting recovery...`);

                    // Since distributeLevelIncome25 handles balance updates and passbook entries,
                    // we can't just call it safely without duplicating for other levels.
                    // Instead, we will manually create the Level 1 record and update blank@blank.com's balance.

                    const tokenValue = product.tokenValue || 10000; // Default mapping
                    const quantity = product.quantity || 1;
                    const baseAmount = tokenValue * quantity;

                    // Level 1 Percentage = 3.6%
                    const annualIncome = (baseAmount * 3.6) / 100;

                    console.log(`    - Crediting ₹${annualIncome} to ${mainUser.email}`);

                    // Create LevelIncome record
                    await LevelIncome.create({
                        user_id: mainUser.id || mainUser.user_id,
                        from_user_id: member.id || member.user_id,
                        level: 1,
                        amount: annualIncome,
                        product_id: product._id,
                        create_at: product.cereate_at || new Date(),
                        created_at: product.cereate_at || new Date()
                    });

                    // Update User Balance (mimicking distributeLevelIncome25 logic)
                    await User.updateOne(
                        { _id: mainUser._id },
                        {
                            $inc: {
                                level_income: annualIncome,
                                total_income: annualIncome
                            }
                        }
                    );

                    recoveredCount++;
                }
            }
        }

        console.log(`\n--- RECOVERY COMPLETE: ${recoveredCount} records corrected ---`);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
