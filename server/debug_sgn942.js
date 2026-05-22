const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const u = await User.findOne({ user_id: 'SGN942' });
        console.log('SGN942:', u._id, u.id, u.user_id);

        const ps = await Product.find({
            $or: [
                { user_id: u._id },
                { user_id: String(u._id) },
                { user_id: u.id },
                { user_id: u.user_id },
                { user_id: '945' }
            ]
        }).lean();

        console.log('Product Count:', ps.length);
        ps.forEach(p => {
            console.log(`Tx: ${p.transcation_id} | Status: ${p.approve} (type: ${typeof p.approve}) | Date: ${p.cereate_at}`);
        });

        process.exit();
    } catch (e) {
        process.exit(1);
    }
};

run();
