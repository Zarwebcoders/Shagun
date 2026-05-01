const mongoose = require('mongoose');
require('dotenv').config();

async function countInv() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const Investment = mongoose.model('Investment', new mongoose.Schema({}, { strict: false }));
        const MiningBonus = mongoose.model('MiningBonus', new mongoose.Schema({}, { strict: false }));

        const activeInv = await Investment.countDocuments({ status: { $regex: /^active$/i } });
        const historyCount = await MiningBonus.countDocuments({});
        
        console.log(`Active Investments: ${activeInv}`);
        console.log(`Total MiningBonus History: ${historyCount}`);

        if (activeInv > 0) {
            const sample = await Investment.findOne({ status: { $regex: /^active$/i } });
            console.log('\nSample Active Investment:');
            console.log(JSON.stringify(sample, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

countInv();
