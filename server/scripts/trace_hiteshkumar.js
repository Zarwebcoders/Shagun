const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function trace() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Hiteshkumar
        const user = await User.findOne({ referral_id: 'SGN9955' });
        console.log(`User: ${user.full_name} (${user.referral_id})`);
        
        // Level 1 Sponsor
        const l1 = await User.findOne({ referral_id: user.sponsor_id });
        console.log(`Level 1 Sponsor: ${l1 ? l1.full_name : 'N/A'} (${user.sponsor_id})`);
        
        // Level 2 Sponsor
        const l2 = l1 ? await User.findOne({ referral_id: l1.sponsor_id }) : null;
        console.log(`Level 2 Sponsor: ${l2 ? l2.full_name : 'N/A'} (${l1 ? l1.sponsor_id : 'N/A'})`);
        
        // Level 3 Sponsor (The person getting Level 3 income)
        const l3 = l2 ? await User.findOne({ referral_id: l2.sponsor_id }) : null;
        console.log(`Level 3 Sponsor: ${l3 ? l3.full_name : 'N/A'} (${l2 ? l2.sponsor_id : 'N/A'})`);

        // Products
        const products = await mongoose.connection.db.collection('products').find({
            user_id: { $in: ['SGN955', '958', '69d4a8ed97d64f202a895410'] },
            approve: { $in: [1, '1'] }
        }).toArray();

        console.log(`\nMatched Products: ${products.length}`);
        console.log(JSON.stringify(products, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

trace();
