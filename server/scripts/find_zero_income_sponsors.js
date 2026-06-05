const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const findZeroSponsors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find all approved products
        const approvedProducts = await Product.find({ approve: 1 });
        console.log(`Found ${approvedProducts.length} approved products.`);

        let missingTotalCount = 0;

        for (const product of approvedProducts) {
            // Find buyer
            const queryIds = [product.user_id]; // In products table, user_id is often the identifier
            const buyer = await User.findOne({
                $or: [
                    { id: product.user_id },
                    { user_id: product.user_id },
                    { referral_id: product.user_id },
                    { _id: mongoose.Types.ObjectId.isValid(product.user_id) ? product.user_id : null }
                ].filter(q => q._id !== null || q.id || q.user_id)
            });

            if (buyer && buyer.sponsor_id) {
                const sponsor = await User.findOne({
                    $or: [
                        { referral_id: buyer.sponsor_id },
                        { user_id: buyer.sponsor_id },
                        { id: buyer.sponsor_id }
                    ]
                });

                if (sponsor && sponsor.sponsor_income === 0) {
                    console.log(`\n[ALERT] Sponsor ${sponsor.full_name} (${sponsor.referral_id}) has 0 balance.`);
                    console.log(`  - From referral: ${buyer.full_name} (${buyer.referral_id})`);
                    console.log(`  - Product: ${product.packag_type}, Amount: ₹${product.amount}`);
                    missingTotalCount++;
                }
            }
        }

        console.log(`\nFound ${missingTotalCount} sponsors with 0 balance who should have income.`);
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

findZeroSponsors();
