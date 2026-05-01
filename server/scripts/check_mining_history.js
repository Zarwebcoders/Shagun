const mongoose = require('mongoose');
require('dotenv').config();

async function checkMining() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const MiningBonus = mongoose.model('MiningBonus', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const user = await User.findOne({ referral_id: 'SGN91080' }); // Testing User9
        if (!user) {
            console.log('User not found.');
            process.exit(0);
        }

        console.log(`User: ${user.full_name} | ID: ${user.id} | UserID: ${user.user_id} | _id: ${user._id}`);

        const query = {
            $or: [
                { user_id: user._id },
                { user_id: user.id },
                { user_id: user.user_id },
                { user_id: user._id.toString() }
            ]
        };

        const history = await MiningBonus.find(query).sort({ created_at: -1 });
        console.log(`\nFound ${history.length} mining history records in database.`);

        history.slice(0, 5).forEach((h, i) => {
            console.log(`${i+1}. Amount: ${h.amount} | Cycle: ${h.cycle_number} | Date: ${h.created_at || h.createdAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMining();
