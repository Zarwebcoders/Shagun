const mongoose = require('mongoose');
require('dotenv').config();

async function listBuyers() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        // Get first 100 users
        const users = await User.find({ is_admin: { $ne: '1' } })
            .sort({ create_at: 1 })
            .limit(100);

        console.log(`Analyzing first ${users.length} users...`);

        const buyersList = [];
        let count = 0;

        for (const user of users) {
            count++;
            const cleanName = (user.full_name || '').trim();
            const rawUser = user.toObject({ virtuals: false });
            const possibleIds = [
                user._id.toString(),
                user.user_id,
                rawUser.id,
                user.referral_id
            ].filter(Boolean);

            const products = await Product.find({
                user_id: { $in: possibleIds },
                $or: [{ approve: 1 }, { approve: '1' }]
            });

            if (count <= 10) {
                console.log(`User ${count}: ${user.user_id} (${cleanName}) | IDs: ${possibleIds.join(', ')} | Products found: ${products.length}`);
            }

            if (products.length > 0) {
                buyersList.push({
                    name: cleanName,
                    user_id: user.user_id,
                    db_id: rawUser.id,
                    productCount: products.length,
                    email: user.email
                });
            }
        }

        console.log(`\nFound ${buyersList.length} buyers among the first 100 users:\n`);
        console.log('Index | User ID | Name | Products | Email');
        console.log('------------------------------------------------------------');
        
        buyersList.forEach((b, i) => {
            console.log(`${String(i + 1).padEnd(5)} | ${String(b.user_id).padEnd(8)} | ${String(b.name).padEnd(25)} | ${String(b.productCount).padEnd(8)} | ${b.email}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listBuyers();
