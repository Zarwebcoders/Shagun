const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const User = require('../models/User');

async function checkSponsors() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const allUsers = await User.find({});
        console.log(`Total users: ${allUsers.length}`);

        const withSponsor = allUsers.filter(u => u.sponsor_id && u.sponsor_id !== '');
        console.log(`Total users with sponsor_id: ${withSponsor.length}`);

        if (withSponsor.length > 0) {
            console.log(`Sample valid sponsor_id: ${withSponsor[0].sponsor_id}`);
        } else {
            console.log("No users have a sponsor! Token distribution impossible.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkSponsors();
