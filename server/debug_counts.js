const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Investment = require('./models/Investment');
const Withdrawal = require('./models/Withdrawal');
const Transaction = require('./models/Transaction');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Checking Collection Counts...");

        const uCount = await User.countDocuments();
        console.log(`Users: ${uCount}`);

        const iCount = await Investment.countDocuments();
        console.log(`Investments: ${iCount}`);
        if (iCount > 0) {
            const iSample = await Investment.findOne();
            console.log("Sample Investment Status:", iSample.status);
        }

        const wCount = await Withdrawal.countDocuments();
        console.log(`Withdrawals: ${wCount}`);
        if (wCount > 0) {
            const wSample = await Withdrawal.findOne();
            console.log("Sample Withdrawal Approve:", wSample.approve);
        }

        const tCount = await Transaction.countDocuments();
        console.log(`Transactions: ${tCount}`);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
