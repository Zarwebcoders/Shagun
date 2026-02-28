const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const Product = require('../models/Product');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const pObjStr = '699edb51092b0b5232819db2'; // Manoj's 110,000 product
        const pObj = new mongoose.Types.ObjectId(pObjStr);

        console.log(`Checking Distributions for Product: ${pObjStr}`);

        const mtdCount = await MonthlyTokenDistribution.countDocuments({ from_purchase_id: pObj });
        console.log(`- Valid Monthly Distributions Created: ${mtdCount}`);

        if (mtdCount > 0) {
            const sampleMtd = await MonthlyTokenDistribution.findOne({ from_purchase_id: pObj }).lean();
            console.log(`- Sample MTD Monthly Amount: ${sampleMtd.monthly_amount}`);
        }

        console.log(`\nChecking Level Incomes (Passbook) for Product: ${pObjStr}`);
        const incomes = await LevelIncome.find({ from_product_id: pObjStr }).lean();

        if (incomes.length === 0) {
            console.log("- NO PASSBOOK INCOMES FOUND!");
        } else {
            for (const inc of incomes) {
                let receiver = await User.findById(inc.user_id).lean();
                let amountStr = Number(inc.amount).toFixed(2);
                let rName = receiver ? `${receiver.full_name} (${receiver.user_id})` : `ID: ${inc.user_id}`;
                console.log(`Level ${inc.level}: ${amountStr} -> deposited to ${rName}`);
            }
        }

    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
