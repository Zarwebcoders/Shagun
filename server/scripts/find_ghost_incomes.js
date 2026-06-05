const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const LevelIncome = require('../models/LevelIncome');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        // Find ANY LevelIncome from this buyer user_id (SGN043 or 43) or email
        const incomes2 = await LevelIncome.find({
            $or: [{ from_user_id: 'SGN043' }, { from_user_id: '43' }]
        }).sort({ created_at: -1 }).limit(20);

        console.log(`\nFound ${incomes2.length} LevelIncome records originating FROM buyer SGN043/43.`);
        for (const i of incomes2) {
            const queryOr = [{ id: i.user_id }, { user_id: i.user_id }, { email: i.user_id }];
            if (mongoose.Types.ObjectId.isValid(i.user_id)) {
                queryOr.push({ _id: i.user_id });
            }
            const receiver = await User.findOne({ $or: queryOr });
            const recName = receiver ? receiver.email || receiver.user_id : 'Unknown';
            const dt = i.created_at || i.create_at;
            console.log(`  Lvl: ${i.level} | Amt: ${i.amount} | Date: ${dt} | Receiver: ${i.user_id} (${recName})`);
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
