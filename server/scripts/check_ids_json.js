const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function checkIds() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const idsToCheck = ['SGN017', 'SGN9017', '17', '9017'];
        const results = {};

        for (const id of idsToCheck) {
            const users = await User.find({
                $or: [
                    { id: id },
                    { user_id: id },
                    { referral_id: id }
                ]
            });
            results[id] = users.map(u => ({
                name: u.full_name,
                email: u.email,
                id: u.id,
                user_id: u.user_id,
                referral_id: u.referral_id,
                sponsor_id: u.sponsor_id
            }));
        }

        fs.writeFileSync(path.join(__dirname, 'id_check_results.json'), JSON.stringify(results, null, 2));
        console.log('Results saved to id_check_results.json');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkIds();
