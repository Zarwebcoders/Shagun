const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function getLalitaProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // IDs from the user record provided
        const user_ids = ['SGN948', '951', '69d4a8ed97d64f202a895409'];

        const products = await mongoose.connection.db.collection('products').find({
            user_id: { $in: user_ids },
            approve: { $in: [1, '1'] }
        }).toArray();

        console.log(`Matched Products: ${products.length}`);
        console.log(JSON.stringify(products, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

getLalitaProducts();
