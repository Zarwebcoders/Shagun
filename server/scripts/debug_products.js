const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        checkProducts();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const checkProducts = async () => {
    try {
        const Product = require('../models/Product');
        const User = require('../models/User'); // Ensure User model is loaded

        console.log('--- Checking Product Data ---');

        const count = await Product.countDocuments();
        console.log(`Total Products: ${count}`);

        const product = await Product.findOne().lean();
        if (product) {
            console.log('Sample Product:', product);
            console.log(`user_id type: ${typeof product.user_id}`);

            // Try lookup
            if (product.user_id) {
                console.log(`Looking up user with id: "${product.user_id}"...`);
                // Match against User.id (legacy)
                const user = await User.findOne({ id: product.user_id });
                console.log(`Found User? ${user ? 'Yes: ' + user.full_name : 'No'}`);
            }
        } else {
            console.log('No products found.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

connectDB();
