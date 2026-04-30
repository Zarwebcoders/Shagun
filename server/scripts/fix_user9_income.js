const mongoose = require('mongoose');
require('dotenv').config();

async function fixIncome() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const ReferralIncomes = mongoose.models.ReferralIncomes || mongoose.model('ReferralIncomes', new mongoose.Schema({}, { strict: false }));

        // Testing User 9 (Earner) and Testing User 10 (Referred)
        const sponsor = await User.findOne({ referral_id: 'SGN91080' });
        const buyer = await User.findOne({ referral_id: 'SGN91081' });

        if (!sponsor || !buyer) {
            console.error('Sponsor or Buyer not found.');
            process.exit(1);
        }

        const referralAmount = 880;

        console.log(`Fixing ReferralIncome records for ${sponsor.full_name}...`);

        // 1. Delete the incorrect records first to avoid confusion
        await ReferralIncomes.deleteMany({
            $or: [
                { user_id: 'SGN91080' },
                { from_user_id: 'SGN91081' }
            ]
        });

        // 2. Create the correct record using names expected by ReferralIncomesController.js
        // earner_user_id and referred_user_id
        await ReferralIncomes.create({
            earner_user_id: sponsor.referral_id, // "SGN91080"
            referred_user_id: buyer.referral_id, // "SGN91081"
            amount: 11000,
            percentage: 8.00,
            referral_amount: referralAmount,
            status: 'credited',
            product_id: '69f33cab003b49ffc9a65c11', // User10's product
            create_at: new Date()
        });

        console.log('Created correct ReferralIncome record with fields earner_user_id and referred_user_id.');
        
        // 3. Final check on balance
        console.log(`Current Balance for ${sponsor.full_name}: ₹${sponsor.sponsor_income}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixIncome();
