const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const ReferralIncome = require('../models/ReferralIncomes');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkLogic = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const buyerId = '1132';
        const product = await Product.findOne({ user_id: buyerId });
        
        if (!product) {
            console.log('No product found for 1132');
            return;
        }

        console.log('--- Product Info ---');
        console.log(`Product _id: ${product._id}, Txn: ${product.transcation_id}, Status: ${product.approve}`);

        const buyer = await User.findOne({ id: 1132 });
        console.log(`Buyer: ${buyer.full_name}, Sponsor ID: ${buyer.sponsor_id}`);

        const sponsor = await User.findOne({ referral_id: buyer.sponsor_id });
        if (sponsor) {
            console.log(`Sponsor: ${sponsor.full_name}, Email: ${sponsor.email}, ID: ${sponsor.id}`);
        } else {
            console.log('Sponsor not found for ID:', buyer.sponsor_id);
        }

        const refIncomes = await ReferralIncome.find({ 
            $or: [
                { product_id: product._id }, 
                { product_transcation_id: product.transcation_id },
                { product_transcation_id: `REF${product.transcation_id}` }
            ] 
        });
        console.log(`ReferralIncomes found for this product: ${refIncomes.length}`);
        refIncomes.forEach(inc => {
            console.log(`- Earner: ${inc.earner_user_id}, Amount: ${inc.referral_amount}`);
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkLogic();
