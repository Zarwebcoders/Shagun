const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const User = require('../models/User');

async function testOrQuery() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Testing $or query with ID: 1");
        const uplineUser = await User.findOne({
            $or: [
                { referral_id: "1" },
                { user_id: "1" },
                { id: "1" }
            ]
        });

        console.log("Result:", uplineUser ? uplineUser.user_id : "NOT FOUND");

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

testOrQuery();
