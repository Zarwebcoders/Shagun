const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const txIds = ['56789', '6778', '677'];

        console.log('Searching for products by Transaction IDs:', txIds.join(', '));
        const ps = await Product.find({ transcation_id: { $in: txIds } }).lean();

        console.log('\nPRODUCTS_FOUND:', ps.length);
        for (const p of ps) {
            console.log(`- Transaction: ${p.transcation_id}, Date: ${p.cereate_at}, User_ID_in_Product: ${p.user_id}, Approve: ${p.approve}`);
            const u = await User.findOne({ $or: [{ id: p.user_id }, { user_id: p.user_id }, { referral_id: p.user_id }] });
            console.log(`  Mapped User: ${u ? u.email : 'NOT FOUND'} (id: ${u ? u.id : 'N/A'}, referral_id: ${u ? u.referral_id : 'N/A'})`);
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
