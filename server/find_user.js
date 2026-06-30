const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function findByBalance() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // User saw 1,74,034.286
        const users = await User.find({ 
            level_income: { $gt: 174000, $lt: 175000 } 
        });
        
        if (users.length === 0) {
            console.log('No users found in 174000-175000 range');
            const topUsers = await User.find({}).sort({level_income: -1}).limit(5);
            console.log('Top users:');
            topUsers.forEach(u => console.log(u.email, u.level_income));
        } else {
            users.forEach(u => console.log(`Found: ${u.email}, Balance: ${u.level_income}, ID: ${u._id}`));
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
findByBalance();
