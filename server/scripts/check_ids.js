const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function checkIds() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const idsToCheck = ['SGN017', 'SGN9017', '17', '9017'];

        for (const id of idsToCheck) {
            const users = await User.find({
                $or: [
                    { id: id },
                    { user_id: id },
                    { referral_id: id }
                ]
            });
            console.log(`Results for ID "${id}": Found ${users.length} users`);
            users.forEach(u => {
                console.log(`  - Name: ${u.full_name}, Email: ${u.email}, ID: ${u.id}, user_id: ${u.user_id}, referral_id: ${u.referral_id}, sponsor_id: ${u.sponsor_id}`);
            });
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkIds();
