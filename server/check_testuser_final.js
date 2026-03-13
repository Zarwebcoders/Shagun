const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const u = await User.findOne({ email: 'testuser@gmail.com' });
        if (u) {
            console.log(`Email: ${u.email}`);
            console.log(`Level Income: ${u.level_income}`);
            console.log(`Mining Bonus: ${u.mining_bonus}`);
            console.log(`Annual Bonus: ${u.anual_bonus}`);
            console.log(`Full Object: ${JSON.stringify({
                level_income: u.level_income,
                mining_bonus: u.mining_bonus,
                anual_bonus: u.anual_bonus
            }, null, 2)}`);
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
checkUser();
