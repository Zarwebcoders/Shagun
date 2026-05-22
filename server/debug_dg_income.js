const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const targetEmail = 'dilipgandhi25@gmail.com';
        const mainUser = await User.findOne({ email: targetEmail });

        if (!mainUser) {
            console.log('Main user not found');
            process.exit(1);
        }

        console.log(`Main User: ${mainUser.full_name} | ID: ${mainUser.id} | RefID: ${mainUser.referral_id}`);

        const members = await User.find({
            sponsor_id: { $regex: new RegExp(`^${mainUser.referral_id}$`, 'i') }
        });

        console.log(`Found ${members.length} Level 1 members.`);
        const db = mongoose.connection.db;

        for (const m of members) {
            console.log(`\n- Member: ${m.full_name} (${m.email}) | ID: ${m.id}`);
            const ps = await db.collection('products').find({
                user_id: { $in: [m._id, String(m._id), m.id, m.user_id, String(m.id)] },
                $or: [
                    { approve: 1 },
                    { approve: '1' },
                    { approvel: 1 },
                    { approvel: '1' }
                ]
            }).toArray();

            console.log(`  Approved Products: ${ps.length}`);
            for (const p of ps) {
                const inc = await LevelIncome.findOne({
                    user_id: mainUser.id,
                    from_user_id: m.id,
                    product_id: p._id
                });
                console.log(`  * Tx: ${p.transcation_id} | Amount: ${p.amount} | IncomeRec: ${inc ? inc.amount : 'NONE'}`);
            }
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
