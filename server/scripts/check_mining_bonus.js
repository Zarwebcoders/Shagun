const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function checkMiningBonus() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email: 'ripaldoshi48@gmail.com' }).lean();
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`User: ${user.full_name} (${user.email})`);
        console.log(`mining_bonus: ${user.mining_bonus}`);

        // Also check if they have any active investments or something that generates mining bonus
        const investments = await mongoose.connection.db.collection('investments').find({ user: user._id }).toArray();
        console.log(`Found ${investments.length} investments:`);
        investments.forEach(inv => {
            console.log(`- Amount: ${inv.amount}, Status: ${inv.status}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkMiningBonus();
