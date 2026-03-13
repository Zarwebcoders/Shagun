const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkExatly() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'testusertwo@gmail.com' });
        if (user) {
            console.log(`Email: ${user.email}`);
            console.log(`Level Income: ${user.level_income}`);
            console.log(`ID: ${user._id}`);
            
            const LevelIncome = require('./models/LevelIncome');
            const queryIds = [user.id, user.user_id, user._id.toString()].filter(id => id);
            const incomes = await LevelIncome.find({ user_id: { $in: queryIds } });
            console.log(`Level Income Records: ${incomes.length}`);
            let total = 0;
            incomes.forEach(inc => {
                total += inc.amount;
                console.log(`- Amount: ${inc.amount}, Date: ${inc.create_at}`);
            });
            console.log(`Sum of Income Records: ${total}`);
        } else {
            console.log('User testusertwo@gmail.com not found');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
checkExatly();
