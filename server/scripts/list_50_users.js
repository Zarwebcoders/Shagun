const mongoose = require('mongoose');
require('dotenv').config();

const User = mongoose.model('User', new mongoose.Schema({
    full_name: String,
    email: String,
    user_id: String,
    id: String
}, { strict: false }));

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const users = await User.find({ is_admin: { $ne: '1' } })
            .sort({ create_at: 1 })
            .limit(50);

        console.log('S.No | User ID | Name | Email');
        console.log('-----------------------------------');
        users.forEach((u, i) => {
            console.log(`${i+1} | ${u.user_id || u.id || 'N/A'} | ${u.full_name || 'N/A'} | ${u.email}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();
