require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const { distributeLevelIncome25, distributeReferralIncome } = require('./utils/levelIncome25');

async function testApproval() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const productId = '69e0c4feee6dca307284eecb'; // From previous search
        const product = await Product.findById(productId);

        if (!product) {
            console.error('Product not found');
            process.exit(1);
        }

        console.log('Found product:', product.transcation_id, 'Status:', product.approve);

        if (product.approve === 1) {
            console.log('Product already approved');
        } else {
            product.approve = 1;
            product.update_at = Date.now();
            await product.save();
            console.log('Product status updated to 1 (Approved)');

            // Distribute Incomes
            console.log('Distributing Referral Income...');
            await distributeReferralIncome(product.user_id, product.amount * product.quantity);

            console.log('Distributing Level Income...');
            await distributeLevelIncome25(
                product.user_id,
                product.token_value,
                product.quantity,
                product._id
            );
        }

        // Verify Results
        const buyer = await User.findOne({ 
            $or: [{ id: product.user_id }, { user_id: product.user_id }]
        });
        const sponsor = await User.findOne({ referral_id: buyer.sponsor_id });

        console.log('\n--- VERIFICATION RESULTS ---');
        console.log(`Buyer: ${buyer.email} (ID: ${buyer.user_id})`);
        console.log(`Buyer Total Income: ${buyer.total_income}`);
        console.log(`Buyer Level Income: ${buyer.level_income}`);
        
        if (sponsor) {
            console.log(`Sponsor: ${sponsor.email} (ID: ${sponsor.user_id})`);
            console.log(`Sponsor Income (Direct 8%): ${sponsor.sponsor_income}`);
            console.log(`Sponsor Total Income: ${sponsor.total_income}`);
        } else {
            console.log('Sponsor not found for buyer');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error during test approval:', err);
        process.exit(1);
    }
}

testApproval();
