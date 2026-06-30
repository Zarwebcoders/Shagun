const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Find a product created after Jan 12 2026
    const pDate = new Date('2026-01-12T00:00:00+05:30');
    const product = await Product.findOne({ 'cereate_at': { $gte: pDate } });
    if (product) {
        console.log('Product Found:', product._id, 'Date:', product.cereate_at, 'Amount:', product.token_value);
        const dist = await MonthlyTokenDistribution.findOne({ from_purchase_id: product._id, level: 0 });
        if (dist) {
            console.log('Buyer Monthly Token Allocation:', dist.monthly_amount);
            console.log('Total Tokens:', dist.monthly_amount * 12);
            console.log('Effective Rate:', product.token_value / (dist.monthly_amount * 12));
        }
    } else {
        console.log('No products found after Jan 12th.');
    }
    mongoose.disconnect();
});
