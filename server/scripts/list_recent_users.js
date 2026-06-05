const mongoose = require('mongoose');
require('dotenv').config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        const users = await User.find({}).sort({ create_at: -1 }).limit(10);
        
        console.log('Recent Users:');
        for (const u of users) {
            const prodCount = await Product.countDocuments({
                $or: [
                    { user_id: u._id.toString() },
                    { user_id: u.id },
                    { user_id: u.user_id }
                ]
            });
            console.log(`- ${u.full_name} | ID: ${u.user_id || u.id} | Products: ${prodCount} | Total Mining: ${u.total_mining_count}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();
