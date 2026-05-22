const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB. Fixing scheduled dates...");

    // Find all distributions
    const distributions = await MonthlyTokenDistribution.find({});

    console.log(`Found ${distributions.length} distributions to check.`);

    let fixedCount = 0;

    for (const dist of distributions) {
        if (dist.from_purchase_id) {
            const product = await Product.findById(dist.from_purchase_id);
            if (product) {
                const purchaseDate = product.cereate_at || product.createdAt;
                if (purchaseDate) {
                    const baseDate = new Date(purchaseDate);
                    const newScheduledDate = new Date(baseDate);
                    // Legacy code uses months (1 to 12) or 15 days?
                    // "har 15 15 days me percent ke hisab se"
                    // Wait, currently levelIncome25 creates them monthly: scheduledDate.setMonth(scheduledDate.getMonth() + month);

                    newScheduledDate.setMonth(newScheduledDate.getMonth() + dist.month_number);

                    // Update only if it's different
                    if (dist.scheduled_date.getTime() !== newScheduledDate.getTime()) {
                        dist.scheduled_date = newScheduledDate;
                        await dist.save();
                        fixedCount++;
                    }
                }
            }
        }
    }

    console.log(`Successfully fixed scheduled dates for ${fixedCount} distributions.`);
    process.exit(0);
});
