const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Investment = require('./models/Investment');
const Product = require('./models/Product');
const Withdrawal = require('./models/Withdrawal');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const totalUsers = await User.countDocuments({ 
            is_admin: { $nin: ["1", 1] },
            is_deleted: { $ne: 1 }
        });

        const [activeInvUsers, approvedProdUsers] = await Promise.all([
            Investment.aggregate([
                { $match: { status: { $regex: /^active$/i } } },
                { $group: { _id: '$user' } }
            ]),
            Product.aggregate([
                { $match: { approve: 1 } },
                { $group: { _id: '$user_id' } }
            ])
        ]);

        const allActiveUserIds = new Set([
            ...activeInvUsers.map(u => u._id.toString()),
            ...approvedProdUsers.map(u => u._id.toString())
        ]);
        const activeUsersCount = allActiveUserIds.size;

        const [revInv, revProd] = await Promise.all([
            Investment.aggregate([
                { $match: { status: { $in: ['active', 'completed', 'Active', 'Completed'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Product.aggregate([
                { $match: { approve: 1 } },
                { $group: { _id: null, total: { $sum: { $multiply: ['$amount', '$quantity'] } } } }
            ])
        ]);

        const totalRevenue = (revInv[0]?.total || 0) + (revProd[0]?.total || 0);

        console.log('--- FINAL RESULTS ---');
        console.log('Total Users:', totalUsers);
        console.log('Active Users:', activeUsersCount);
        console.log('Total Revenue:', totalRevenue);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
阻
