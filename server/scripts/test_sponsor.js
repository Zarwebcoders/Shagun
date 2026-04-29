const mongoose = require('mongoose');
require('dotenv').config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function test() {
    await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
    const sponsor = await User.findOne({
        $or: [
            { user_id: 'SGN9003' },
            { id: 'SGN9003' },
            { referral_id: 'SGN9003' }
        ]
    });
    console.log('Sponsor Found:', sponsor ? sponsor.full_name : 'NO');
    process.exit(0);
}

test();
