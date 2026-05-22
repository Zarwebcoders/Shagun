const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Fetching all Wallets and Users...");
        const wallets = await Wallet.find().lean();
        const users = await User.find().select('_id user_id id').lean();

        // Create Set of valid User IDs (ObjectId strings, user_id strings, id strings)
        const validUserIds = new Set();
        users.forEach(u => {
            validUserIds.add(u._id.toString());
            if (u.user_id) validUserIds.add(String(u.user_id).trim());
            if (u.id) validUserIds.add(String(u.id).trim());
        });

        const orphans = [];
        wallets.forEach(w => {
            const uid = String(w.user_id).trim();
            if (!validUserIds.has(uid)) {
                orphans.push(w._id);
            }
        });

        console.log(`Found ${wallets.length} total wallets.`);
        console.log(`Found ${orphans.length} orphaned wallets (Users do not exist).`);

        if (orphans.length > 0) {
            console.log("Deleting orphaned wallets...");
            const result = await Wallet.deleteMany({ _id: { $in: orphans } });
            console.log(`Deleted ${result.deletedCount} wallets.`);
        } else {
            console.log("No orphans found. Data is clean.");
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
