const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const LevelIncome = require('../models/LevelIncome');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        console.log('Testing LevelIncome creation...');
        const doc = await LevelIncome.create({
            user_id: "SGN043",
            from_user_id: "SGN9000",
            level: 1,
            amount: 100,
            product_id: "699edb51092b0b5232819def",
            create_at: new Date(),
            created_at: new Date()
        });
        console.log('Success:', doc);
    } catch (err) {
        console.error('Test insertion failed:', err);
    } finally {
        mongoose.disconnect();
    }
});
