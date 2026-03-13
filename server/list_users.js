const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ level_income: { $exists: true } }).sort({ level_income: -1 }).limit(10);
        users.forEach(u => {
            console.log(`Email: ${u.email}, Balance: ${u.level_income}, ID: ${u._id}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
listUsers();
