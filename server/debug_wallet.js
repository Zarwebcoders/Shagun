const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Wallet = require('./models/Wallet');
const User = require('./models/User');

// Load env vars
dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const debug = async () => {
    await connectDB();

    try {
        const wallets = await Wallet.find().lean();
        console.log(`\nFound ${wallets.length} wallets in DB.`);

        for (const w of wallets) {
            const uid = w.user_id;
            console.log(`\n--------------------------------------------------`);
            console.log(`Wallet Doc ID: ${w._id}`);
            console.log(`Stored user_id: '${uid}'`);
            console.log(`Type of user_id: ${typeof uid}`);

            // 1. Try finding as ObjectId (if valid string or object)
            let user = null;
            if (mongoose.isValidObjectId(uid)) {
                user = await User.findById(uid);
                if (user) {
                    console.log(`[SUCCESS] Found via User.findById`);
                    console.log(`   User Name: ${user.full_name}`);
                    console.log(`   User _id: ${user._id}`);
                } else {
                    console.log(`[FAILED] Valid ObjectId, but findById returned null.`);
                }
            } else {
                console.log(`[INFO] Not a valid ObjectId format.`);
            }

            if (!user) {
                // 2. Try finding by user_id string
                user = await User.findOne({ user_id: uid });
                if (user) {
                    console.log(`[SUCCESS] Found via User.findOne({ user_id: '${uid}' })`);
                    console.log(`   User Name: ${user.full_name}`);
                } else {
                    console.log(`[FAILED] User.findOne({ user_id: '${uid}' }) returned null.`);
                }
            }

            if (!user) {
                // 3. Try finding by id string
                user = await User.findOne({ id: uid });
                if (user) {
                    console.log(`[SUCCESS] Found via User.findOne({ id: '${uid}' })`);
                    console.log(`   User Name: ${user.full_name}`);
                } else {
                    console.log(`[FAILED] User.findOne({ id: '${uid}' }) returned null.`);
                }
            }

            if (!user) {
                // 4. Try regex (whitespace?)
                user = await User.findOne({ $or: [{ user_id: new RegExp(`^${uid}$`, 'i') }, { id: new RegExp(`^${uid}$`, 'i') }] });
                if (user) {
                    console.log(`[SUCCESS] Found via Regex (Case Insensitive/Whitespace?)`);
                    console.log(`   User Name: ${user.full_name}`);
                    console.log(`   Real id: '${user.id}', Real user_id: '${user.user_id}'`);
                } else {
                    console.log(`[FAILED] Even Regex search failed.`);
                }
            }

            if (!user) {
                console.log(`RESULT: USER UNKNOWN for this wallet.`);
            }
        }
        console.log(`\n--------------------------------------------------`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debug();
