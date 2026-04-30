const mongoose = require('mongoose');
require('dotenv').config();

async function checkUser9() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const ReferralIncomes = mongoose.model('ReferralIncomes', new mongoose.Schema({}, { strict: false }));

        // Find Testing User9
        const user9 = await User.findOne({ $or: [{ user_id: 'SGN1080' }, { referral_id: 'SGN91080' }] });
        if (!user9) {
            console.log('Testing User9 not found.');
            process.exit(0);
        }

        console.log(`User: ${user9.full_name} | Sponsor: ${user9.sponsor_id}`);

        // Find products
        const products = await Product.find({ 
            user_id: { $in: ['SGN1080', '1080', user9._id.toString()] } 
        });

        console.log(`\nFound ${products.length} products for User9:`);
        for (const p of products) {
            console.log(`- ID: ${p._id} | Package: ${p.packag_type} | Status: ${p.approve} (1=Approved) | Amount: ₹${p.amount}`);
            
            // Check if referral income exists for this product
            const income = await ReferralIncomes.findOne({ 
                $or: [{ product_id: p._id }, { product_transcation_id: p.transcation_id }] 
            });
            console.log(`  Referral Income Record: ${income ? 'Found (₹' + income.referral_amount + ')' : 'NOT FOUND'}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser9();
