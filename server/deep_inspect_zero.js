const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const mainUser = await User.findOne({ email: 'dilipgandhi25@gmail.com' });
    const mainId = String(mainUser.id || mainUser.user_id);

    const members = await User.find({
        sponsor_id: { $regex: new RegExp(`^${mainUser.referral_id}$`, 'i') }
    });

    console.log(`Main User: ${mainUser.full_name} | RefID: ${mainUser.referral_id}`);
    console.log(`Level 1 members: ${members.length}\n`);

    for (const m of members) {
        const mStrId = String(m.id || m.user_id);

        // Check income record
        const incRec = await LevelIncome.find({ user_id: mainId, from_user_id: mStrId, level: 1 }).lean();

        // Check ALL products for this member
        const searchIds = [m._id, String(m._id), m.id, m.user_id, String(m.id)].filter(Boolean);
        const allProducts = await db.collection('products').find({ user_id: { $in: searchIds } }).toArray();
        const approvedProducts = allProducts.filter(p =>
            p.approve == 1 || p.approve === '1' || p.approvel == 1 || p.approvel === '1'
        );

        const status = incRec.length > 0
            ? `✓ ${incRec.length} income record(s), monthly: ${(incRec.reduce((s, r) => s + r.amount, 0) / 12).toFixed(2)}`
            : approvedProducts.length === 0
                ? '⚠ LEGITIMATE ZERO (no approved products)'
                : `✗ MISSING INCOME (${approvedProducts.length} approved products exist!)`;

        console.log(`${m.full_name} (${m.email})`);
        console.log(`  id: ${m.id} | All Products: ${allProducts.length} | Approved: ${approvedProducts.length}`);
        console.log(`  Income: ${status}`);
        if (approvedProducts.length > 0 && incRec.length === 0) {
            approvedProducts.forEach(p => {
                console.log(`  - Tx: ${p.transcation_id} | user_id in DB: ${p.user_id} | approve: ${p.approve || p.approvel}`);
            });
        }
        console.log('');
    }

    process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
