const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const ReferralIncomes = require('../models/ReferralIncomes');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const findUserRobustly = async (id) => {
    if (!id) return null;
    if (mongoose.Types.ObjectId.isValid(id)) {
        const user = await User.findById(id);
        if (user) return user;
    }
    return await User.findOne({
        $or: [
            { user_id: id },
            { id: id },
            { referral_id: id }
        ]
    });
};

const runAudit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const approvedProducts = await Product.find({ 
            $or: [{ approve: 1 }, { approve: "1" }]
        });

        console.log(`Checking ${approvedProducts.length} approved products...`);

        let missingCount = 0;
        for (const product of approvedProducts) {
            const hasHistory = await ReferralIncomes.findOne({
                $or: [
                    { product_id: String(product._id) },
                    { product_transcation_id: product.transcation_id }
                ]
            });

            if (!hasHistory) {
                missingCount++;
                const buyer = await findUserRobustly(product.user_id);
                if (buyer) {
                    const sponsor = await findUserRobustly(buyer.sponsor_id);
                    console.log(`[MISSING] Product: ${product._id}, Buyer: ${buyer.referral_id} (${buyer.full_name}), Sponsor ID: ${buyer.sponsor_id}, Sponsor Found: ${!!sponsor}`);
                } else {
                    console.log(`[MISSING] Product: ${product._id}, Buyer ID: ${product.user_id} NOT FOUND!`);
                }
            }
        }

        console.log(`\nTotal Missing History Records: ${missingCount}`);
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

runAudit();
