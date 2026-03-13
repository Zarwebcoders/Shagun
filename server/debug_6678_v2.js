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
        console.log('Tx ID:', p.transcation_id);
        console.log('Packag Type:', p.packag_type);
        console.log('Amount:', p.amount);
        console.log('Token Amount:', p.token_amount);
        console.log('Quantity:', p.quantity);
        console.log('Date:', p.cereate_at);

        const incomes = await LevelIncome.find({ product_id: p._id }).lean();
        console.log('Income Records Count:', incomes.length);
        incomes.forEach((inc, i) => {
            console.log(`Record ${i + 1}: User:${inc.user_id} FromUser:${inc.from_user_id} Level:${inc.level} Amount:${inc.amount}`);
        });

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
