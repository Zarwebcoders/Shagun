const mongoose = require('mongoose');
require('dotenv').config();

async function checkSponsorIncome() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const ReferralIncomes = mongoose.model('ReferralIncomes', new mongoose.Schema({}, { strict: false }));

        // Find Sponsor (SGN9922)
        const sponsor = await User.findOne({ referral_id: 'SGN9922' });
        if (!sponsor) {
            console.log('Sponsor SGN9922 not found.');
            process.exit(0);
        }

        const sponsorStrId = sponsor.id || sponsor.user_id || sponsor._id.toString();

        console.log(`Sponsor: ${sponsor.full_name} (${sponsor.referral_id})`);
        
        // Find all referral incomes for this sponsor
        const incomes = await ReferralIncomes.find({
            user_id: { $in: [sponsorStrId, sponsor._id.toString(), 'SGN9922'] }
        });

        console.log(`\nTotal Referral Income Records found for Sponsor: ${incomes.length}`);

        for (const inc of incomes) {
            // Find who this income came from
            const fromUser = await User.findOne({ 
                $or: [{ id: inc.from_user_id }, { user_id: inc.from_user_id }, { _id: mongoose.Types.ObjectId.isValid(inc.from_user_id) ? inc.from_user_id : null }]
            });
            
            console.log(`- Amount: ₹${inc.referral_amount} | From: ${fromUser ? fromUser.full_name : inc.from_user_id} | Date: ${inc.create_at}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSponsorIncome();
