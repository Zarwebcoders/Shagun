const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        checkKYCData();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const checkKYCData = async () => {
    try {
        const KYC = require('../models/KYC');

        console.log('--- Checking KYC Data ---');

        const total = await KYC.countDocuments();
        console.log(`Total KYC records: ${total}`);

        const pending = await KYC.countDocuments({ approval: 2 });
        console.log(`Pending (approval: 2): ${pending}`);

        const approved = await KYC.countDocuments({ approval: 1 });
        console.log(`Approved (approval: 1): ${approved}`);

        const rejected = await KYC.countDocuments({ approval: 0 });
        console.log(`Rejected (approval: 0): ${rejected}`);

        const other = await KYC.find({ approval: { $nin: [0, 1, 2] } });
        if (other.length > 0) {
            console.log('Found records with invalid approval status:', other);
        } else {
            console.log('No records with invalid approval status found.');
        }

        const history = await KYC.find({ approval: { $ne: 2 } }).select('approval user_id');
        console.log(`History query result count: ${history.length}`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

connectDB();
