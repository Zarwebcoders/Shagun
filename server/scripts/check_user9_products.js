const mongoose = require('mongoose');
require('dotenv').config();

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const user = await User.findOne({ referral_id: 'SGN91080' });
        if (!user) {
            console.log('User not found.');
            process.exit(0);
        }

        console.log(`User: ${user.full_name} | ID: ${user.id} | UserID: ${user.user_id} | _id: ${user._id}`);

        const query = {
            $or: [
                { user_id: user._id },
                { user_id: user.id },
                { user_id: user.user_id },
                { user_id: user._id.toString() }
            ],
            approve: 1
        };

        const prods = await Product.find(query);
        console.log(`\nFound ${prods.length} active products.`);

        prods.forEach((p, i) => {
            console.log(`${i+1}. Product: ${p.packag_type} | Daily Return: ${p.daily_return_amount} | Status: ${p.approve}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkProducts();
