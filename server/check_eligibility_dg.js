const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const u = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
        if (u) {
            console.log(`User: ${u.full_name} | ID: ${u.id} | ShoppingTokens: ${u.shopping_tokens}`);
            const db = mongoose.connection.db;
            const ps = await db.collection('products').find({
                user_id: { $in: [u._id, String(u._id), u.id, u.user_id, String(u.id)] },
                $or: [{ approve: 1 }, { approve: '1' }, { approvel: 1 }, { approvel: '1' }]
            }).toArray();

            console.log(`Approved Products: ${ps.length}`);
            ps.forEach(p => {
                console.log(`- Tx: ${p.transcation_id} | Date: ${p.cereate_at}`);
            });
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
