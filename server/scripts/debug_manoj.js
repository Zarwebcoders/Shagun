const mongoose = require('mongoose');
require('dotenv').config();

async function debugManoj() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        const user = await User.findOne({ full_name: /MANOJ KUMAR CHOURE/i });
        if (!user) {
            console.log('User not found');
            process.exit(0);
        }

        const userId = user.id || user.user_id || user._id.toString();
        console.log(`User: ${user.full_name} | ID: ${userId}`);

        const products = await Product.find({ 
            user_id: { $in: [userId, user._id.toString()] }
        });

        console.log('\nProducts for Manoj:');
        products.forEach(p => {
            const date = p.cereate_at || p.create_at || p.created_at;
            console.log(`- ID: ${p._id} | Date: ${date} | Amount: ${p.amount} | Tokens: ${p.token_amount} | Approve: ${p.approve}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugManoj();
