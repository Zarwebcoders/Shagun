const mongoose = require('mongoose');
require('dotenv').config();

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        const userIds = ['SGN047', 'SGN633', '47', '633', '636']; // Checking all possibilities

        const products = await Product.find({ 
            user_id: { $in: userIds }
        });

        console.log(`Found ${products.length} products:`);
        products.forEach(p => {
            const date = p.cereate_at || p.create_at || p.created_at;
            console.log(`- ID: ${p._id} | UserID: ${p.user_id} | Date: ${date} | Amount: ${p.amount} | Tokens: ${p.token_amount}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkProducts();
