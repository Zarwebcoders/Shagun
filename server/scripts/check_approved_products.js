const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const c1 = await LevelIncome.countDocuments({ level: { $gt: 0 } });
        console.log('Level > 0 passbook records:', c1);

        const prods = await Product.find({ approvel: 1 });
        console.log(`Total active Approved products in DB: ${prods.length}`);

        if (prods.length > 0) {
            console.log("Sample 3 products:", prods.slice(0, 3).map(p => ({
                id: p._id,
                user_id: p.user_id,
                approvel: p.approvel,
                token_value: p.token_value
            })));
        }

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
