const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const members = await User.find({
            sponsor_id: { $regex: /^SGN9007$/i }
        }).lean();

        console.log(`Found ${members.length} Level 1 members.`);

        for (const m of members) {
            const ps = await Product.find({
                user_id: { $in: [m._id, String(m._id), m.id, m.user_id, String(m.id)] },
                $or: [{ approve: 1 }, { approve: '1' }]
            }).lean();

            if (ps.length > 0) {
                console.log(`\nMember: ${m.full_name} (${m.user_id || m.id})`);
                ps.forEach(p => {
                    console.log(`- Tx: ${p.transcation_id} | TokenVal: ${p.token_value || p.token_amount} | Qty: ${p.quantity} | Date: ${p.cereate_at}`);
                });
            } else {
                console.log(`\nMember: ${m.full_name} (${m.user_id || m.id}) - No approved products.`);
            }
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
