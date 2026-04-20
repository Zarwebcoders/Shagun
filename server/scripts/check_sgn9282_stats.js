const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function getSGN9282Stats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const user = await User.findOne({ referral_id: 'SGN9282' });
        
        if (!user) {
            console.log("User SGN9282 not found");
            return;
        }

        console.log("User Stats for SGN9282:");
        console.log(JSON.stringify({
            full_name: user.full_name,
            mining_count_thismounth: user.mining_count_thismounth,
            total_mining_count: user.total_mining_count,
            airdrop_tokons: user.airdrop_tokons,
            mining_bonus: user.mining_bonus
        }, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

getSGN9282Stats();
