const mongoose = require('mongoose');
require('dotenv').config();

async function checkCounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        const total = await Product.countDocuments({});
        const approved = await Product.countDocuments({ $or: [{ approve: 1 }, { approve: '1' }] });
        const pending = await Product.countDocuments({ $or: [{ approve: 0 }, { approve: '0' }, { approve: null }, { approve: { $exists: false } }] });

        console.log(`Total Products in DB: ${total}`);
        console.log(`Approved Products: ${approved}`);
        console.log(`Pending Products: ${pending}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCounts();
