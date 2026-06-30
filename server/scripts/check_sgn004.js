const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const count = await Product.countDocuments({ 
        user_id: '4', 
        $or: [{ approve: 1 }, { approve: '1' }] 
    });
    console.log('SGN004 Approved Products:', count);
    process.exit(0);
}
check();
