const mongoose = require('mongoose');
require('dotenv').config();

async function checkUser10() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        // Find Testing User10
        const user10 = await User.findOne({ $or: [{ user_id: 'SGN1081' }, { referral_id: 'SGN91081' }] });
        if (user10) {
            console.log(`User10: ${user10.full_name} | Sponsor: ${user10.sponsor_id}`);
            
            const products = await Product.find({ 
                user_id: { $in: ['SGN1081', '1081', user10._id.toString()] } 
            });
            console.log(`User10 Products: ${products.length}`);
            products.forEach(p => console.log(`- ${p.packag_type} | Status: ${p.approve}`));
        } else {
            console.log('User10 not found.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser10();
