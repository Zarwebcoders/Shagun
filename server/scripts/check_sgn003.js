const mongoose = require('mongoose');
require('dotenv').config();

const LevelIncome = mongoose.model('LevelIncome', new mongoose.Schema({}, { strict: false }));
const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
const User = mongoose.model('User', new mongoose.Schema({ full_name: String, user_id: String }, { strict: false }));

async function checkSGN003() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        // Using "3" as it matches the user's legacy ID in the LevelIncome collection
        const incomes = await LevelIncome.find({ user_id: "3", level: 1 });

        console.log(`\nNIRMALABEN (SGN003) - Level 1 Income Details:\n`);
        
        let grandTotal = 0;

        for (const inc of incomes) {
            const fromUser = await User.findOne({ 
                $or: [
                    { id: inc.from_user_id },
                    { user_id: inc.from_user_id },
                    { _id: mongoose.Types.ObjectId.isValid(inc.from_user_id) ? inc.from_user_id : null }
                ].filter(q => q.id || q.user_id || q._id)
            });

            const prod = await Product.findById(inc.product_id);
            
            console.log(`- From User: ${fromUser ? fromUser.full_name : inc.from_user_id} (${fromUser ? fromUser.user_id : 'N/A'})`);
            console.log(`  Product: ${prod ? prod.packag_type : 'N/A'}`);
            console.log(`  Purchase Amount: ${prod ? prod.amount : 'N/A'}`);
            console.log(`  Quantity: ${prod ? prod.quantity : 'N/A'}`);
            console.log(`  Level 1 Income Generated: ${inc.amount.toFixed(3)} SGN`);
            console.log('  -----------------------------------');
            grandTotal += inc.amount;
        }

        console.log(`\nGrand Total Level 1 Income: ${grandTotal.toFixed(3)} SGN`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSGN003();
