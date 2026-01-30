const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        checkIDs();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const checkIDs = async () => {
    try {
        const KYC = require('../models/KYC');
        const User = require('../models/User');

        console.log('--- Checking ID formats ---');

        // Get one KYC record
        const kyc = await KYC.findOne({ approval: { $ne: 2 } }).lean();
        if (kyc) {
            console.log('Sample KYC Record:');
            console.log(`_id: ${kyc._id}`);
            console.log(`user_id (in KYC): ${kyc.user_id} (Type: ${typeof kyc.user_id})`);

            // Try to find User by this ID as _id
            let userByObjId = null;
            if (mongoose.Types.ObjectId.isValid(kyc.user_id)) {
                userByObjId = await User.findById(kyc.user_id).select('full_name email');
            }
            console.log(`Found User by _id? ${userByObjId ? 'Yes: ' + userByObjId.full_name : 'No'}`);

            // Try to find User by this ID as custom user_id
            const userByCustomId = await User.findOne({ user_id: kyc.user_id }).select('full_name email');
            console.log(`Found User by custom user_id (user_id: "${kyc.user_id}")? ${userByCustomId ? 'Yes' : 'No'}`);

            // Try to find User by "id" field (legacy?)
            // We need to bypass mongoose schema strictness if "id" is not in schema? 
            // Actually findOne usually allows it.
            const userById = await User.findOne({ id: kyc.user_id }).select('full_name email');
            console.log(`Found User by legacy id (id: "${kyc.user_id}")? ${userById ? 'Yes' : 'No'}`);

            if (userById) {
                console.log(`User found: ${userById.full_name}`);
            }

            if (userByCustomId) {
                console.log('Sample User Record:');
                console.log(`_id: ${userByCustomId._id}`);
                console.log(`user_id: ${userByCustomId.user_id}`);
            }

        } else {
            console.log('No KYC history records found to inspect.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

connectDB();
