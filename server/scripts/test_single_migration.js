const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const Product = require('../models/Product');
const User = require('../models/User');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const { distributeLevelIncome25 } = require('../utils/levelIncome25');

async function testSingle() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        const products = await db.collection('products').find({ approve: '1' }).toArray();
        let targetProduct = null;
        let targetUser = null;

        for (const rawProduct of products) {
            let user = await User.findOne({ id: String(rawProduct.user_id) });
            if (!user) {
                const stringUserId = String(rawProduct.user_id);
                const paddedId = stringUserId.padStart(3, '0');
                const sgnId = 'SGN' + paddedId;
                user = await User.findOne({ user_id: sgnId });
            }
            if (!user) {
                user = await User.findOne({ user_id: String(rawProduct.user_id) });
            }

            if (user) {
                targetProduct = rawProduct;
                targetUser = user;
                break;
            }
        }

        if (!targetProduct || !targetUser) {
            return console.log("Could not find any product with a valid user document.");
        }

        console.log("TESTING SINGLE PRODUCT:", targetProduct._id, "USER:", targetUser.user_id);

        console.log("Found User. Calling distributeLevelIncome25...");

        await distributeLevelIncome25(
            targetUser._id,
            10000,
            1,
            targetProduct._id
        );

        console.log("Function returned.");
    } catch (err) {
        require('fs').writeFileSync('error.txt', err.stack);
        console.error("Wrote error to error.txt");
    } finally {
        await mongoose.disconnect();
    }
}

testSingle();
