const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Transaction = require('../models/Transaction');
const User = require('../models/User');
const KYC = require('../models/KYC');

async function testTransactionsLogic() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("--- TESTING TRANSACTIONS LOGIC (ADMIN VIEW) ---");

        // Simulate the logic in adminController/transactionController
        const transactions = await Transaction.find({})
            .populate('user', 'full_name email wallet')
            .populate('relatedUser', 'full_name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        console.log(`Fetched ${transactions.length} transactions`);

        const userIds = [...new Set(transactions.map(t => {
            if (t.user?._id) return t.user._id.toString();
            if (t.user) return t.user.toString();
            return null;
        }).filter(id => id))];

        console.log("Unique User IDs:", userIds);

        const kycRecords = await KYC.find({ user_id: { $in: userIds } }).lean();
        console.log(`Found ${kycRecords.length} KYC records`);

        const kycMap = {};
        kycRecords.forEach(kyc => {
            if (kyc.user_id) kycMap[kyc.user_id.toString()] = kyc;
        });

        const mapped = transactions.map(t => {
            const userId = t.user?._id?.toString() || t.user?.toString();
            const kyc = kycMap[userId];
            return {
                id: t._id,
                user: userId,
                bankDetails: kyc ? {
                    bank_name: kyc.bank_name,
                    acc_name: kyc.acc_name,
                    branch: kyc.branch,
                    ifsc_code: kyc.ifsc_code,
                    acc_num: kyc.acc_num
                } : null
            };
        });

        console.log("Sample Mapped Transaction:", JSON.stringify(mapped[0], null, 2));
        console.log("SUCCESS: Logic executed without crashing.");

    } catch (err) {
        console.error("CRASH DETECTED:", err);
    } finally {
        await mongoose.disconnect();
    }
}

testTransactionsLogic();
