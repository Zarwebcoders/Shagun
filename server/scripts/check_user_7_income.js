const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const LevelIncome = require('../models/LevelIncome');
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const userId = "7";
        const userObjId = "699edb91092b0b5232819eaf";
        const userStrId = "SGN007";

        const incomes = await LevelIncome.find({
            $or: [
                { user_id: userId },
                { user_id: userObjId },
                { user_id: userStrId }
            ]
        }).lean();

        let totalAmount = 0;
        console.log(`--- Level Income Breakdown for User ${userId} ---`);
        for (const inc of incomes) {
            totalAmount += inc.amount;

            // fetch buyer details safely
            let buyer = null;
            const isObjId = mongoose.Types.ObjectId.isValid(inc.from_user_id) && String(new mongoose.Types.ObjectId(inc.from_user_id)) === String(inc.from_user_id);

            if (isObjId) {
                buyer = await User.findById(inc.from_user_id).lean();
            } else {
                buyer = await User.findOne({
                    $or: [{ id: inc.from_user_id }, { user_id: inc.from_user_id }]
                }).lean();
            }

            let amountStr = Number(inc.amount).toFixed(2);
            let pDateStr = inc.create_at ? new Date(inc.create_at).toLocaleDateString() : 'N/A';

            let buyerTitle = buyer ? `${buyer.full_name} (${buyer.email})` : `ID: ${inc.from_user_id}`;
            if (inc.level === 0) {
                console.log(`[Self-ROI] from own Product: ₹${amountStr} (Date: ${pDateStr})`);
            } else {
                console.log(`[Level ${inc.level}] from ${buyerTitle}: ₹${amountStr} (Date: ${pDateStr})`);
            }
        }
        console.log(`-----------------------------------------------`);
        console.log(`Total Level Income Calculated: ₹${totalAmount.toFixed(4)}`);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
});
