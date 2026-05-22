const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Vendor = require('./models/Vendor');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const targetId = '697204fba8f83443dbf54176';
        console.log(`Searching for ID: ${targetId}`);

        // Check User.user_id (String field)
        const uString = await User.findOne({ user_id: targetId });
        console.log(`User.user_id match: ${uString ? uString.full_name : 'NO'}`);

        // Check Vendor._id
        if (mongoose.isValidObjectId(targetId)) {
            const vId = await Vendor.findById(targetId);
            console.log(`Vendor.findById match: ${vId ? vId.full_name : 'NO'}`);
        }

        // Check Vendor.user_id (if exists)
        // Checking schema via query
        try {
            // assuming vendor has user_id or similar
            const vString = await Vendor.findOne({ user_id: targetId });
            console.log(`Vendor.user_id match: ${vString ? vString.full_name : 'NO'}`);
        } catch (e) { console.log("Vendor.user_id error: " + e.message); }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
