const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const Product = require('../models/Product');

const getTokenRate = (date) => {
    // 6 Dec 2025 IST (Assumed 2025 based on previous check, let's verify)
    const d6 = new Date('2025-12-06T00:00:00+05:30');
    // 27 Dec 2025 IST
    const d27 = new Date('2025-12-27T00:00:00+05:30');

    if (date < d6) {
        return 4.0;
    } else if (date >= d6 && date < d27) {
        return 4.8;
    } else {
        return 5.8;
    }
};

const testTokenPrice = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected\n');

        // Find some sample products to verify
        const earliest = await Product.findOne().sort({ cereate_at: 1 });
        const mid = await Product.findOne({ cereate_at: { $gte: new Date('2025-12-15') } }).sort({ cereate_at: 1 });
        const latest = await Product.findOne({ cereate_at: { $gte: new Date('2025-12-28') } }).sort({ cereate_at: 1 });

        if (earliest) console.log(`Earliest Date: ${earliest.cereate_at.toISOString()} -> Rate: ${getTokenRate(earliest.cereate_at)}`);
        if (mid) console.log(`Mid Date: ${mid.cereate_at.toISOString()} -> Rate: ${getTokenRate(mid.cereate_at)}`);
        if (latest) console.log(`Latest Date: ${latest.cereate_at.toISOString()} -> Rate: ${getTokenRate(latest.cereate_at)}`);

        // Check the math for 10k package
        console.log("\nCalculation Verification:");
        const tokenVal = 10000;
        console.log(`Before Dec 6: Tokens = ${tokenVal} / 4.0 = ${tokenVal / 4.0}`);
        console.log(`Dec 6 to Dec 26: Tokens = ${tokenVal} / 4.8 = ${tokenVal / 4.8}`);
        console.log(`After Dec 27: Tokens = ${tokenVal} / 5.8 = ${tokenVal / 5.8}`);

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

testTokenPrice();
