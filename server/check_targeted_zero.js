const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const mainUser = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
        const db = mongoose.connection.db;
        const emails = [
            'shahprajesh@gmail.com',
            'gandhihemangini260@gmail.com',
            'patelmahendra2006@gmail.com',
            'maheshgandhi2009@gmail.com',
            'admin@zoomintos.biz'
        ];

        console.log(`Checking members for Main User: ${mainUser.full_name} (${mainUser.id})`);

        for (const email of emails) {
            const u = await User.findOne({ email });
            if (u) {
                console.log(`\nMember: ${u.full_name} (${u.email}) | ID:${u.id}`);
                const ps = await db.collection('products').find({
                    user_id: { $in: [u._id, String(u._id), u.id, u.user_id, String(u.id)] },
                    $or: [
                        { approve: 1 },
                        { approve: '1' },
                        { approvel: 1 },
                        { approvel: '1' }
                    ]
                }).toArray();

                console.log(`   Approved Products: ${ps.length}`);
                for (const p of ps) {
                    const inc = await LevelIncome.findOne({
                        user_id: mainUser.id,
                        from_user_id: u.id,
                        product_id: p._id
                    });
                    console.log(`   * Tx: ${p.transcation_id} | Amount: ${p.amount} | Date: ${p.cereate_at} | IncomeRec: ${inc ? inc.amount : 'MISSING'}`);
                }
            } else {
                console.log(`\nMember not found: ${email}`);
            }
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
