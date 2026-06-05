const mongoose = require('mongoose');
require('dotenv').config();

async function countAll() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        const MiningBonus = mongoose.model('MiningBonus', new mongoose.Schema({}, { strict: false }));

        const prodCount = await Product.countDocuments({});
        const miningCount = await MiningBonus.countDocuments({});
        
        console.log(`Total Products: ${prodCount}`);
        console.log(`Total MiningBonus Records: ${miningCount}`);

        if (prodCount > 0) {
            const sample = await Product.findOne({});
            console.log('\nSample Product:');
            console.log(JSON.stringify(sample, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

countAll();
