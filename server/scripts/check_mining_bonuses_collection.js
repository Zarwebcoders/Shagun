const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const MiningBonus = require('../models/MiningBonus');

async function checkMiningBonusRecords() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email: 'ripaldoshi48@gmail.com' }).lean();
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`User: ${user.full_name} (${user.email}), ID: ${user.id}, _id: ${user._id}`);

        const ids = [user.id, String(user._id), user.user_id].filter(id => id);

        const bonuses = await MiningBonus.find({ user_id: { $in: ids } }).lean();

        console.log(`Found ${bonuses.length} mining bonus records for this user.`);

        let total = 0;
        bonuses.forEach(b => {
            console.log(`- Amount: ${b.amount}, Date: ${b.created_at || b.create_at}`);
            total += b.amount;
        });

        console.log(`Total calculated from records: ${total}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkMiningBonusRecords();
