const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        process.exit(1);
    }
};

const debug = async () => {
    await connectDB();

    try {
        const users = await User.find().limit(10).lean();
        console.log(`\nListing first 10 users:`);
        users.forEach(u => {
            console.log(`_id: ${u._id} | user_id: '${u.user_id}' | id: '${u.id}' | name: ${u.full_name}`);
        });

        // Specifically look for id "1" or user_id "1"
        console.log("\nSearching specific '1':");
        const u1 = await User.findOne({ user_id: "1" });
        console.log(`User with user_id="1": ${u1 ? u1.full_name : 'NOT FOUND'}`);

        const u2 = await User.findOne({ id: "1" });
        console.log(`User with id="1": ${u2 ? u2.full_name : 'NOT FOUND'}`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debug();
