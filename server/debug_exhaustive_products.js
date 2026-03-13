const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const u = await User.findOne({ email: 'blank@blank.com' });
        if (u) {
            console.log('USER_INFO');
            console.log('Email:', u.email);
            console.log('_id:', u._id);
            console.log('id:', u.id);
            console.log('user_id:', u.user_id);
            console.log('referral_id:', u.referral_id);

            const ps = await Product.find({
                $or: [
                    { user_id: String(u._id) },
                    { user_id: u.id },
                    { user_id: u.user_id },
                    { user_id: u.referral_id },
                    { user_id: "7" } // Explicitly check numeric ID
                ]
            }).sort({ cereate_at: 1 });

            console.log('\nPRODUCTS_FOUND:', ps.length);
            ps.forEach(p => {
                console.log(`- Date: ${p.cereate_at}, ID: ${p.product_id}, Approve: ${p.approve}, Amount: ${p.amount}, UserID_in_Product: ${p.user_id}`);
            });
        } else {
            console.log('User not found');
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
