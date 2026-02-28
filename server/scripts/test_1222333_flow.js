const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Product = require('../models/Product');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const pObjStr = '699edb51092b0b5232819db2'; // Manoj's 110,000 product
        const pObj = new mongoose.Types.ObjectId(pObjStr);

        console.log(`Analyzing why MTDs aborted before LevelIncome generation...`);

        const dists = await MonthlyTokenDistribution.find({ from_purchase_id: pObj }).lean();
        console.log(`Distributions Count: ${dists.length}`);

        let sampleMtd = dists[0];

        // Emulate the levelIncome25 logic
        let rawProduct = await mongoose.connection.db.collection('products').findOne({ _id: sampleMtd.from_purchase_id });
        console.log(`Is Product Found from MTD ID? ${!!rawProduct} | ID: ${rawProduct._id}`);
        console.log(`Product.user_id = '${rawProduct.user_id}'`);

        // Emulate User Finder
        let buyerIdObjMatch = null;
        let buyer = await User.findOne({
            $or: [{ id: rawProduct.user_id }, { user_id: rawProduct.user_id }, { _id: rawProduct.user_id }]
        }).lean();

        if (!buyer) {
            console.log(`ABORT: Buyer not found using Product.user_id='${rawProduct.user_id}' Mongoose cast failed!`);
        } else {
            console.log(`Buyer Found: ${buyer.full_name} | Sponsor: ${buyer.sponsor_id}`);

            // Emulate Sponsor fetching loop
            let currentSponsorId = buyer.sponsor_id;
            let sponsor = await User.findOne({
                $or: [{ user_id: currentSponsorId }, { id: currentSponsorId.toString() }, { id: currentSponsorId.replace('SGN', '') }]
            }).lean();

            if (!sponsor) {
                console.log(`ABORT: Sponsor '${currentSponsorId}' not found! Hierarchy crushed!`);
            } else {
                console.log(`Sponsor Found: ${sponsor.full_name}`);
            }
        }
    } catch (err) { console.log(err); } finally { mongoose.disconnect(); }
});
