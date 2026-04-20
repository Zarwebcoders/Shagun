const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function debugProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Let's find products where the user is definitively Hitendra
        // Hitendra's ID is 644 or SGN641 or 69d4a8ed97d64f202a8952f6
        const products = await mongoose.connection.db.collection('products').find({
            $or: [
                { user_id: "644" },
                { user_id: "SGN641" },
                { user_id: "69d4a8ed97d64f202a8952f6" },
                { user_id: 644 }
            ]
        }).toArray();

        console.log(`Matching Products: ${products.length}`);
        console.log(JSON.stringify(products, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugProducts();
