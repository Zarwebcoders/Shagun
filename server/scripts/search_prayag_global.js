const mongoose = require('mongoose');
require('dotenv').config();

async function searchGlobal() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        
        console.log('Searching for ANY product linked to SGN9924...');
        const products = await Product.find({
            $or: [
                { user_id: /9924/i },
                { transcation_id: /9924/i },
                { wallet_address: /9924/i }
            ]
        });

        console.log(`Results: ${products.length}`);
        products.forEach(p => {
            console.log(`ID: ${p._id} | User: ${p.user_id} | Package: ${p.packag_type} | Status: ${p.approve}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

searchGlobal();
