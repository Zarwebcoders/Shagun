const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const members = await User.find({
            sponsor_id: { $regex: /^SGN9007$/i }
        }).lean();

        const results = [];
        const db = mongoose.connection.db;

        for (const m of members) {
            const possibleIds = [
                m._id,
                String(m._id),
                m.id,
                m.user_id,
                String(m.id)
            ].filter(Boolean);

            const ps = await db.collection('products').find({
                user_id: { $in: possibleIds },
                $or: [
                    { approve: 1 },
                    { approve: '1' },
                    { approvel: '1' },
                    { approvel: 1 }
                ]
            }).toArray();

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
                    packag_type: p.packag_type,
                    token_amount: p.token_amount,
                    cereate_at: p.cereate_at,
                    approve: p.approve
                }))
            });
        }

        fs.writeFileSync('l1_products_raw.json', JSON.stringify(results, null, 2));
        console.log('Results written to l1_products_raw.json');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
