const mongoose = require('mongoose');
require('dotenv').config();

async function debugReferral() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        
        // Use existing models if available to avoid OverwriteModelError
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        const ReferralIncomes = mongoose.models.ReferralIncomes || mongoose.model('ReferralIncomes', new mongoose.Schema({}, { strict: false }));

        // Testing User 10 (Buyer)
        const user10 = await User.findOne({ referral_id: 'SGN91081' });
        if (!user10) {
            console.log('User10 (SGN91081) not found.');
            process.exit(1);
        }

        const product = await Product.findOne({ 
            user_id: { $in: ['SGN1081', '1081', user10._id.toString()] },
            approve: 1
        });

        if (!product) {
            console.log('No approved product found for User10.');
            process.exit(1);
        }

        console.log(`Checking Referral Income for Product ${product._id} (User10)...`);
        
        const income = await ReferralIncomes.findOne({ 
            $or: [{ product_id: product._id }, { product_transcation_id: product.transcation_id }] 
        });

        if (income) {
            console.log(`Income Record Found: ₹${income.referral_amount} to ${income.user_id}`);
        } else {
            console.log('NO Referral Income record found in database!');
            
            // Re-triggering the distribution logic
            const { distributeReferralIncome } = require('../utils/levelIncome25');
            console.log('Triggering distributeReferralIncome manually...');
            await distributeReferralIncome(user10._id.toString(), product.amount * product.quantity);
            console.log('Distribution logic finished.');
            
            // Refresh User9 to see if income updated
            const user9 = await User.findOne({ referral_id: 'SGN91080' });
            console.log(`User9 Updated Sponsor Income: ₹${user9.sponsor_income}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Debug Error:', err);
        process.exit(1);
    }
}

debugReferral();
