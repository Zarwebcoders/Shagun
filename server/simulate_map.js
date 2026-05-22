const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Wallet = require('./models/Wallet');
const User = require('./models/User');
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Simulate what's in controller
        const wallets = await Wallet.find().lean();
        const userIdsToFetch = [...new Set(wallets.map(w => String(w.user_id)))];
        console.log("IDs to fetch (sample):", userIdsToFetch.slice(0, 10));

        const users = await User.find({
            $or: [
                { _id: { $in: userIdsToFetch.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } },
                { user_id: { $in: userIdsToFetch } },
                { id: { $in: userIdsToFetch } }
            ]
        }).select('_id user_id id full_name email').lean();

        console.log(`Found ${users.length} users.`);

        const userMap = {};
        users.forEach(u => {
            userMap[u._id.toString()] = u;
            if (u.user_id) userMap[u.user_id] = u;
            if (u.id) userMap[u.id] = u;
        });

        console.log("Map keys (sample):", Object.keys(userMap).slice(0, 20));

        // Check specific wallet failure
        for (const w of wallets.slice(0, 10)) {
            const key = String(w.user_id);
            const found = userMap[key];
            console.log(`Wallet UserID: '${key}' -> Found: ${!!found}  (Name: ${found?.full_name})`);
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
