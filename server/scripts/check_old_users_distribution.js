const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // relative to server/scripts/

const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const fs = require('fs');

async function checkOldUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const totalProducts = await Product.countDocuments({ approve: 1 });
        const products = await Product.find({ approve: 1 });

        let productsWithDistribution = 0;
        let productsWithoutDistribution = 0;

        for (const p of products) {
            const count = await MonthlyTokenDistribution.countDocuments({ from_purchase_id: p._id });
            if (count > 0) {
                productsWithDistribution++;
            } else {
                productsWithoutDistribution++;
            }
        }

        const result = {
            totalProducts,
            withDistribution: productsWithDistribution,
            withoutDistribution: productsWithoutDistribution
        };

        fs.writeFileSync('db_check_result.json', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkOldUsers();
