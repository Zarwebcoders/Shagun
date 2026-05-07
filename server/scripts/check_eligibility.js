const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function check() {
    const { isUserEligible } = require('../utils/levelIncome25');
    const User = require('../models/User');
    const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
    await mongoose.connect(uri);

    const emails = ['rathi.neeti70@gmail.com', 'manish@zoomintos.biz', 'shpatel35@gmail.com'];
    
    for (const email of emails) {
        const user = await User.findOne({ email });
        if (user) {
            const ok = await isUserEligible(user._id);
            console.log(`${email}: ${ok ? 'ACTIVE (Eligible)' : 'INACTIVE (Not Eligible)'}`);
        } else {
            console.log(`${email}: NOT FOUND`);
        }
    }
    process.exit(0);
}
check();
