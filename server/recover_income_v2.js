const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- RECOVERY V2 START ---');

        const mainUser = await User.findOne({ email: 'blank@blank.com' }).lean();
        const refId = mainUser.referral_id;

        console.log(`Main User: ${mainUser.full_name} (${refId})`);

        // Find members whose sponsor_id matches (case-insensitive)
        const members = await User.find({
            sponsor_id: { $regex: new RegExp(`^${refId}$`, 'i') }
        }).lean();

        console.log(`Level 1 Members found: ${members.length}`);

        for (const member of members) {
            console.log(`\nMember: ${member.full_name} (IDs: _id:${member._id}, id:${member.id}, user_id:${member.user_id})`);

            // Collect all possible ID strings to search in Products
            const possibleIdStrings = [
                String(member._id),
                member.id,
                member.user_id,
                member.user_id ? member.user_id.toLowerCase() : null,
                member.user_id ? member.user_id.toUpperCase() : null
            ].filter(Boolean);

            // Fetch all products for these IDs
            const products = await Product.find({
                user_id: { $in: possibleIdStrings }
            }).lean();

            console.log(`- Products found: ${products.length}`);

            for (const product of products) {
                // Check if approved (String or Number)
                const isApproved = String(product.approve) === '1';
                console.log(`  - Tx: ${product.transcation_id} | Status: ${product.approve} | Approved: ${isApproved}`);

                if (isApproved) {
                    // Check if LevelIncome for main user already exists
                    const existing = await LevelIncome.findOne({
                        user_id: mainUser.id || mainUser.user_id,
                        from_user_id: member.id || member.user_id,
                        product_id: product._id,
                        level: 1
                    });

                    if (existing) {
                        console.log(`    - ALREADY EXISTS: ₹${existing.amount}`);
                    } else {
                        console.log(`    - MISSING: Crediting now...`);

                        // Calculate income
                        const tokenValue = product.tokenValue || 10000;
                        const quantity = product.quantity || 1;
                        const income = (tokenValue * quantity * 3.6) / 100;

                        // Create record
                        await LevelIncome.create({
                            user_id: mainUser.id || mainUser.user_id,
                            from_user_id: member.id || member.user_id,
                            level: 1,
                            amount: income,
                            product_id: product._id,
                            create_at: product.cereate_at || new Date(),
                            created_at: product.cereate_at || new Date()
                        });

                        // Update balance
                        await User.updateOne(
                            { _id: mainUser._id },
                            { $inc: { level_income: income, total_income: income } }
                        );

                        console.log(`    - SUCCESS: Added ₹${income}`);
                    }
                }
            }
        }

        console.log('\n--- RECOVERY V2 COMPLETE ---');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
