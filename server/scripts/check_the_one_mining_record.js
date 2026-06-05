const mongoose = require('mongoose');
require('dotenv').config();

async function checkRecord() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const MiningBonus = mongoose.model('MiningBonus', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const record = await MiningBonus.findOne({});
        console.log('Mining Record:');
        console.log(JSON.stringify(record, null, 2));

        if (record && record.user_id) {
            const user = await User.findOne({ 
                $or: [
                    { _id: mongoose.Types.ObjectId.isValid(record.user_id) ? record.user_id : null },
                    { id: record.user_id },
                    { user_id: record.user_id }
                ].filter(q => q._id || q.id || q.user_id)
            });
            if (user) {
                console.log(`\nUser: ${user.full_name} | Email: ${user.email} | ID: ${user.user_id}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRecord();
