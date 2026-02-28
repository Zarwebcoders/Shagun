const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const LevelIncome = require('../models/LevelIncome');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const earlyProducts = await mongoose.connection.db.collection('products')
            .find({ approve: '1' })
            .toArray();

        let skippedProducts = [];
        let dec6Date = new Date('2025-12-06T00:00:00Z');

        for (const p of earlyProducts) {
            // Manually parse strings or dates
            let pDate = new Date(p.cereate_at);

            if (pDate < dec6Date) {
                const count = await MonthlyTokenDistribution.countDocuments({ from_purchase_id: p._id });
                if (count === 0) {
                    skippedProducts.push(p);
                }
            }
        }

        console.log(`Found ${skippedProducts.length} approved products before Dec 6 that HAVE NO DISTRIBUTIONS!`);

        if (skippedProducts.length > 0) {
            console.log("\n--- Skipping Diagnostics ---");
            for (let i = 0; i < Math.min(5, skippedProducts.length); i++) {
                const sp = skippedProducts[i];
                console.log(`ID: ${sp._id} | User ID: ${sp.user_id} | Amount: ₹${sp.amount} | Date: ${sp.cereate_at}`);
            }

            // Specifically test one of the "skipped"
            const sample = skippedProducts[0];
            const matchingLevel = await LevelIncome.find({ from_product_id: String(sample._id) }).lean();
            console.log(`Does this sample have any LevelIncome attached? ${matchingLevel.length}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
});
