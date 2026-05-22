const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixInactiveReferrals() {
    try {
        const User = require('../models/User');
        const Transaction = require('../models/Transaction');
        const ReferralIncomes = require('../models/ReferralIncomes');
        const { isUserEligible } = require('../utils/levelIncome25');

        const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB. Fixing Inactive Referral Incomes...');

        // 1. Get all referral income records
        const allReferrals = await ReferralIncomes.find({});
        console.log(`Analyzing ${allReferrals.length} referral income records...`);

        let fixedCount = 0;
        let totalDeducted = 0;

        for (const record of allReferrals) {
            // Find the earner (sponsor)
            // Earner ID could be user_id string or ObjectId string in this model
            const sponsor = await User.findOne({
                $or: [
                    { _id: mongoose.Types.ObjectId.isValid(record.earner_user_id) ? record.earner_user_id : null },
                    { user_id: record.earner_user_id },
                    { id: record.earner_user_id }
                ]
            });

            if (!sponsor) {
                console.warn(`Sponsor not found for record ${record._id}, skipping.`);
                continue;
            }

            // Check eligibility
            const eligible = await isUserEligible(sponsor._id);

            if (!eligible) {
                console.log(`Cleaning up Referral Income for INACTIVE user: ${sponsor.email} (Amount: ₹${record.referral_amount})`);

                const amountToDeduct = record.referral_amount || 0;

                // A. Deduct from User balances
                sponsor.sponsor_income = Math.max(0, (sponsor.sponsor_income || 0) - amountToDeduct);
                sponsor.total_income = Math.max(0, (sponsor.total_income || 0) - amountToDeduct);
                await sponsor.save();

                // B. Delete Transaction record
                // We match by user, type, and amount. Also relatedUser if available.
                await Transaction.deleteMany({
                    user: sponsor._id,
                    type: 'referral',
                    amount: amountToDeduct,
                    relatedUser: mongoose.Types.ObjectId.isValid(record.referred_user_id) ? record.referred_user_id : { $exists: true }
                });

                // C. Delete ReferralIncomes record
                await ReferralIncomes.findByIdAndDelete(record._id);

                fixedCount++;
                totalDeducted += amountToDeduct;
            }
        }

        console.log(`\n--- CORRECTION SUMMARY ---`);
        console.log(`Inactive referral records removed: ${fixedCount}`);
        console.log(`Total amount deducted from inactive users: ₹${totalDeducted}`);
        process.exit(0);
    } catch (err) {
        console.error('Error during referral cleanup:', err);
        process.exit(1);
    }
}

fixInactiveReferrals();
