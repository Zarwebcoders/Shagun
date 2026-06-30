const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const targetDate = new Date('2025-12-06T00:00:00Z');

        // Find all approved products before Dec 6
        const earlyProducts = await mongoose.connection.db.collection('products').find({
            cereate_at: { $lt: targetDate },
            approve: '1'
        }).toArray();

        console.log(`Found ${earlyProducts.length} approved products before Dec 6.`);

        let skippedProducts = [];
        for (const p of earlyProducts) {
            const count = await MonthlyTokenDistribution.countDocuments({ from_purchase_id: p._id });
            if (count === 0) {
                skippedProducts.push(p);
            }
        }

        console.log(`Of those, ${skippedProducts.length} products have NO distributions generated!`);

        if (skippedProducts.length > 0) {
            console.log("\n--- Sample Skipped Products ---");
            for (let i = 0; i < Math.min(5, skippedProducts.length); i++) {
                const sp = skippedProducts[i];
                console.log(`ID: ${sp._id} | User ID: ${sp.user_id} | Amount: ₹${sp.amount} | Date: ${new Date(sp.cereate_at).toLocaleDateString()}`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
});
