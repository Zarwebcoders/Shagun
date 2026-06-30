const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');
        const users = await User.find({
            $or: [
                { id: "1089" },
                { user_id: "1089" },
                { referral_id: "1089" },
                { id: 1089 },
                { user_id: 1089 }
            ]
        });
        console.log("Matching users for 1089:");
        console.log(JSON.stringify(users, null, 2));

        const users1017 = await User.find({
            $or: [
                { id: "1017" },
                { user_id: "1017" },
                { referral_id: "1017" },
                { id: 1017 },
                { user_id: 1017 }
            ]
        });
        console.log("Matching users for 1017:");
        console.log(JSON.stringify(users1017, null, 2));

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

check();
