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
            const ps = await Product.find({
                $or: [
                    { user_id: u._id },
                    { user_id: u.id },
                    { user_id: u.user_id }
                ]
            }).sort({ cereate_at: 1 }); // Oldest first
            console.log('PRODUCTS_START');
            ps.forEach(p => {
                console.log(`- Date: ${p.cereate_at}, ID: ${p.product_id}, Approve: ${p.approve}`);
            });
            console.log('PRODUCTS_END');
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
