const mongoose = require('mongoose');
require('dotenv').config();

const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

async function test() {
    await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
    const count = await Product.countDocuments({ 
        user_id: '3', 
        $or: [{approve: 1}, {approve: '1'}] 
    });
    console.log('Approved Product Count for NIRMALABEN (3):', count);
    process.exit(0);
}

test();
