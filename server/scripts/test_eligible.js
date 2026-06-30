const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const Product = require('../models/Product');
const User = require('../models/User');

async function testEligible() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const u = await User.findOne({ id: '1' });

        if (!u) return console.log("User 1 not found");

        const products = await Product.find({
            $and: [
                {
                    $or: [
                        { user_id: u._id },
                        { user_id: String(u._id) },
                        { user_id: u.user_id },
                        { user_id: u.id },
                        { user_id: u.referral_id }
                    ]
                },
                {
                    $or: [{ approve: 1 }, { approve: '1' }]
                }
            ]
        });

        console.log(`User ${u.id} (${u.user_id}) has ${products.length} approved products.`);

        // Also check shopping tokens
        console.log(`Tokens: Shopping=${u.shopping_tokens}, Airdrop=${u.airdrop_tokens}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

testEligible();
