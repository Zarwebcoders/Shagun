const mongoose = require('mongoose');
require('dotenv').config();

async function checkMaxLevel() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const LevelIncome = mongoose.model('LevelIncome', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        console.log('Calculating maximum downline depth per user...');

        const results = await LevelIncome.aggregate([
            {
                $group: {
                    _id: '$user_id',
                    maxLevel: { $max: '$level' }
                }
            },
            { $sort: { maxLevel: -1 } },
            { $limit: 10 }
        ]);

        if (results.length === 0) {
            console.log('No level income records found.');
            process.exit(0);
        }

        console.log('\nTop Users with Deepest Downlines:');
        console.log('Rank | User ID | Name | Max Level Reached');
        console.log('-------------------------------------------');

        for (let i = 0; i < results.length; i++) {
            const res = results[i];
            const user = await User.findOne({ 
                $or: [{ user_id: res._id }, { id: res._id }, { _id: mongoose.Types.ObjectId.isValid(res._id) ? res._id : null }] 
            });
            
            const name = user ? user.full_name : 'Unknown User';
            console.log(`${String(i + 1).padEnd(4)} | ${String(res._id).padEnd(8)} | ${String(name).padEnd(20)} | Level ${res.maxLevel}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMaxLevel();
