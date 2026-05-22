const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Investment = require('../models/Investment');
const Product = require('../models/Product');
const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');

async function verifyUpdates() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("--- VERIFYING ADMIN STATS (MIMICKING CONTROLLER) ---");

        // 1. Total Users
        const totalUsers = await User.countDocuments({ 
            is_admin: { $nin: ["1", 1] },
            is_deleted: { $ne: 1 }
        });
        console.log("Total Users:", totalUsers);

        // 2. Active Users
        const [activeInvUsers, approvedProdUsers] = await Promise.all([
            Investment.aggregate([
                { $match: { status: { $regex: /^active$/i } } },
                { $group: { _id: '$user' } }
            ]),
            Product.aggregate([
                { $match: { approve: { $in: [1, "1"] } } },
                { $group: { _id: '$user_id' } }
            ])
        ]);
        const allActiveUserIds = new Set([
            ...activeInvUsers.map(u => u._id.toString()),
            ...approvedProdUsers.map(u => u._id.toString())
        ]);
        console.log("Active Users:", allActiveUserIds.size);

        // 3. Total Revenue
        const [revInv, revProd] = await Promise.all([
            Investment.aggregate([
                { $match: { status: { $in: ['active', 'completed', 'Active', 'Completed'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Product.aggregate([
                { $match: { approve: { $in: [1, "1"] } } },
                { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
            ])
        ]);
        const totalRevenue = (revInv[0]?.total || 0) + (revProd[0]?.total || 0);
        console.log("Total Revenue: ₹", totalRevenue.toLocaleString());

        // 4. Active Investments
        const [countInv, countProd] = await Promise.all([
            Investment.countDocuments({ status: { $in: ['active', 'Active'] } }),
            Product.countDocuments({ approve: { $in: [1, "1"] } })
        ]);
        console.log("Active Investments Count:", countInv + countProd);

        // 5. Withdrawal/Transfers
        const totalWithdrawalResult = await Withdrawal.aggregate([
            { $match: { approve: { $in: ["1", 1] } } },
            { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
        ]);
        console.log("Total Withdrawal: ₹", (totalWithdrawalResult[0]?.total || 0).toLocaleString());

        const pendingWithdrawals = await Withdrawal.countDocuments({ approve: { $in: ["2", 2] } });
        console.log("Pending Withdrawals:", pendingWithdrawals);

        const totalTransactions = await Transaction.countDocuments({});
        console.log("Total Transactions:", totalTransactions);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyUpdates();
