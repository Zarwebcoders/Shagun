const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const members = await User.find({
            sponsor_id: { $regex: /^SGN9007$/i }
        }).lean();

        const results = [];

        for (const m of members) {
            const ps = await Product.find({
                user_id: { $in: [m._id, String(m._id), m.id, m.user_id, String(m.id)] },
                $or: [{ approve: 1 }, { approve: '1' }]
            }).lean();

            results.push({
                member: {
                    full_name: m.full_name,
                    user_id: m.user_id,
                    id: m.id,
                    email: m.email
                },
                products: ps.map(p => ({
                    transcation_id: p.transcation_id,
                    token_value: p.token_value || p.token_amount,
                    quantity: p.quantity,
                    cereate_at: p.cereate_at
                }))
            });
        }

        fs.writeFileSync('l1_products.json', JSON.stringify(results, null, 2));
        console.log('Results written to l1_products.json');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
