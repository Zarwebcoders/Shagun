const mongoose = require('mongoose');
require('dotenv').config();

async function findManojs() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const users = await User.find({ full_name: /MANOJ/i });
        console.log(`Found ${users.length} users with "MANOJ":`);
        users.forEach(u => {
            console.log(`- ${u.full_name} | user_id: ${u.user_id} | id: ${u.id} | email: ${u.email} | Date: ${u.create_at}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findManojs();
