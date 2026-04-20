const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function auditStats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("--- PRODUCT AUDIT ---");
        const productStats = await mongoose.connection.db.collection('products').aggregate([
            { $group: { _id: "$approve", count: { $sum: 1 } } }
        ]).toArray();
        console.log("Product Approval Statuses:", JSON.stringify(productStats, null, 2));

        const revenueAudit = await mongoose.connection.db.collection('products').aggregate([
            { $match: { approve: { $in: [1, "1"] } } },
            { $group: { _id: null, total: { $sum: { $multiply: [{ $toDouble: "$amount" }, { $toDouble: "$quantity" }] } } } }
        ]).toArray();
        console.log("Calculated Product Revenue:", revenueAudit[0]?.total || 0);

        console.log("\n--- INVESTMENT AUDIT ---");
        const investmentStats = await mongoose.connection.db.collection('investments').aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();
        console.log("Investment Statuses:", JSON.stringify(investmentStats, null, 2));

        const invRevenueAudit = await mongoose.connection.db.collection('investments').aggregate([
            { $match: { status: { $in: ['active', 'completed', 'Active', 'Completed'] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray();
        console.log("Calculated Investment Revenue:", invRevenueAudit[0]?.total || 0);

        console.log("\n--- USER AUDIT ---");
        const totalUsers = await mongoose.connection.db.collection('users').countDocuments({ 
            is_admin: { $nin: ["1", 1] },
            is_deleted: { $ne: 1 }
        });
        console.log("Total Users (non-admin):", totalUsers);

        const activeUsersCount = await mongoose.connection.db.collection('products').distinct("user_id", { approve: { $in: [1, "1"] } });
        console.log("Active Users (Product based):", activeUsersCount.length);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

auditStats();
