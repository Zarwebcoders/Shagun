const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const Product = require('../models/Product');
const User = require('../models/User');

async function checkSponsorEligibility() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find all sponsors who have someone referred to them
        const users = await User.find({ sponsor_id: { $ne: null } });
        const sponsorIds = new Set(users.map(u => u.sponsor_id));

        console.log(`Total unique sponsors: ${sponsorIds.size}`);

        let eligibleSponsors = 0;

        for (const sId of sponsorIds) {
            let u;
            if (mongoose.Types.ObjectId.isValid(sId) && String(new mongoose.Types.ObjectId(sId)) === String(sId)) {
                u = await User.findById(sId);
            } else {
                u = await User.findOne({
                    $or: [
                        { referral_id: sId },
                        { user_id: sId },
                        { id: sId }
                    ]
                });
            }

            if (!u) continue;

            // Check eligibility
            const hasPurchase = await Product.findOne({
                $and: [
                    {
                        $or: [
                            { user_id: u._id },
                            { user_id: String(u._id) },
                            { user_id: u.user_id },
                            { user_id: u.id },
                            { user_id: u.referral_id }
                        ]
                    },
                    {
                        $or: [{ approve: 1 }, { approve: '1' }]
                    }
                ]
            });

            if (hasPurchase || u.shopping_tokens > 0 || u.airdrop_tokens > 0) {
                require('fs').appendFileSync('eligible_sponsors.txt', `Eligible Sponsor: ${u.email} ID: ${u.id} user_id: ${u.user_id} sponsor_id: ${u.sponsor_id}\n`);
                eligibleSponsors++;
            }
        }

        console.log(`Of ${sponsorIds.size} sponsors, ${eligibleSponsors} are actually eligible to receive tokens.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkSponsorEligibility();
