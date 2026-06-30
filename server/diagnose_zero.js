const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        // Members still showing 0 income - check what their products look like
        const emails = ['namrata@gmail.com', 'shahprajesh@gmail.com', 'gandhihemangini260@gmail.com', 'patelmahendra2006@gmail.com', 'maheshgandhi2009@gmail.com', 'admin@zoomintos.biz'];

        for (const email of emails) {
            const u = await User.findOne({ email });
            if (!u) {
                console.log(`\nNOT FOUND: ${email}`);
                continue;
            }
            console.log(`\nUser: ${u.full_name} | id: ${u.id} | user_id: ${u.user_id} | _id: ${u._id}`);

            // Check all possible product matches
            const searchKeys = [u._id, String(u._id), u.id, u.user_id, String(u.id)].filter(x => x);
            const products = await db.collection('products').find({
                user_id: { $in: searchKeys },
                $or: [{ approve: 1 }, { approve: '1' }, { approvel: 1 }, { approvel: '1' }]
            }).toArray();

            console.log(`  Approved Products: ${products.length}`);
            products.forEach(p => {
                console.log(`  - Tx: ${p.transcation_id} | user_id in DB: "${p.user_id}" (type: ${typeof p.user_id})`);
            });

            // Also try to find any products that might be stored differently
            const anyProducts = await db.collection('products').find({ user_id: u.id }).toArray();
            const anyProducts2 = await db.collection('products').find({ user_id: String(u._id) }).toArray();
            console.log(`  Products by id field: ${anyProducts.length}`);
            console.log(`  Products by String(_id): ${anyProducts2.length}`);
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
