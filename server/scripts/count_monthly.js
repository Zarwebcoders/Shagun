const mongoose = require('mongoose');
require('dotenv').config();

async function countMonthly() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const MonthlyDist = mongoose.model('MonthlyTokenDistribution', new mongoose.Schema({}, { strict: false }));

        const total = await MonthlyDist.countDocuments({});
        const paid = await MonthlyDist.countDocuments({ status: 'paid' });
        const pending = await MonthlyDist.countDocuments({ status: 'pending' });
        
        console.log(`Total Monthly Distributions: ${total}`);
        console.log(`Paid: ${paid}`);
        console.log(`Pending: ${pending}`);

        if (total > 0) {
            const sample = await MonthlyDist.findOne({ status: 'paid' });
            if (sample) {
                console.log('\nSample Paid Distribution:');
                console.log(JSON.stringify(sample, null, 2));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

countMonthly();
