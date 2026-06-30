const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Withdrawal = require('./models/Withdrawal');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("\n--- Checking Users ---");
        const sampleUser = await User.findOne().lean();
        console.log("Sample User:", sampleUser ? `Name: ${sampleUser.full_name}, is_admin: ${sampleUser.is_admin} (Type: ${typeof sampleUser.is_admin})` : "No users found");

        // Count with filters
        const c1 = await User.countDocuments({ is_admin: 0 });
        const c2 = await User.countDocuments({ is_admin: "0" });
        const c3 = await User.countDocuments();
        console.log(`Count({is_admin: 0}): ${c1}`);
        console.log(`Count({is_admin: "0"}): ${c2}`);
        console.log(`Total Users: ${c3}`);

        console.log("\n--- Checking Withdrawals ---");
        const sampleW = await Withdrawal.findOne().lean();
        console.log("Sample Withdrawal:", sampleW ? `Approve: ${sampleW.approve} (Type: ${typeof sampleW.approve})` : "No withdrawals");

        const w1 = await Withdrawal.countDocuments({ approve: 2 });
        const w2 = await Withdrawal.countDocuments({ approve: "2" });
        console.log(`Count({approve: 2}): ${w1}`);
        console.log(`Count({approve: "2"}): ${w2}`);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
