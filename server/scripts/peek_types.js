const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
        const User = require('../models/User');

        const doc = await MonthlyTokenDistribution.findOne({}).lean();
        console.log("Single MonthlyTokenDistribution document:", doc);
        if (doc) {
            console.log("user_id type:", typeof doc.user_id, doc.user_id.constructor.name);
        }

        const user = await User.findOne({ email: 'manish@zoomintos.biz' }).lean();
        if (user) {
            console.log("\nUser document fields:");
            console.log("_id:", user._id, typeof user._id, user._id.constructor.name);
            console.log("id:", user.id, typeof user.id);
            console.log("user_id:", user.user_id, typeof user.user_id);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
