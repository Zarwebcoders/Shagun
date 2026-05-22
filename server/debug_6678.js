const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const p = await Product.findOne({ transcation_id: '6678' }).lean();
        if (!p) {
            console.log('Product 6678 not found');
            process.exit(1);
        }
        console.log('--- PRODUCT DATA ---');
        console.log(JSON.stringify(p, null, 2));

        const incomes = await LevelIncome.find({ product_id: p._id }).lean();
        console.log('\n--- LEVEL INCOME RECORDS ---');
        console.log(JSON.stringify(incomes, null, 2));

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
