const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    email: String,
    user_id: String,
    id: String,
    full_name: String
}, { strict: false });

const ProductSchema = new mongoose.Schema({
    user_id: String,
    tokenValue: Number,
    quantity: Number,
    approve: mongoose.Schema.Types.Mixed
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'ravipoonia9088@gmail.com' });
        if (!user) {
            console.log('User not found: ravipoonia9088@gmail.com');
            process.exit(0);
        }

        console.log('User Found:');
        console.log('Name:', user.full_name);
        console.log('User ID:', user.user_id);
        console.log('ID Field:', user.id);
        console.log('MongoDB ID:', user._id);

        const products = await Product.find({
            $or: [
                { user_id: user._id },
                { user_id: String(user._id) },
                { user_id: user.user_id },
                { user_id: user.id }
            ]
        });

        console.log('\nProducts Purchased:');
        products.forEach(p => {
            console.log(`- Product Data:`, JSON.stringify(p, null, 2));
        });

        const totalTokenValue = products.reduce((acc, p) => {
            if (p.approve == '1' || p.approve == 1) {
                // If tokenValue is missing, try to get it from PRODUCT_DEFINITIONS
                let tv = p.tokenValue;
                if (!tv && p.product_id) {
                    const PRODUCT_DEFINITIONS = {
                        1: { name: 'Milkish Herbal', price: 11000, tokenValue: 10000 },
                        2: { name: 'Petro', price: 12500, tokenValue: 10000 },
                        3: { name: 'Smart Home', price: 20000, tokenValue: 10000 },
                        4: { name: 'Shagun EV', price: 85000, tokenValue: 20000 }
                    };
                    tv = PRODUCT_DEFINITIONS[p.product_id]?.tokenValue;
                }
                // Also check if token_value (snake_case)
                if (!tv) tv = p.token_value;
                
                return acc + (Number(tv || 0) * Number(p.quantity || 1));
            }
            return acc;
        }, 0);

        console.log('\nTotal Approved Token Value:', totalTokenValue);

        const productsJan = await Product.find({ 
            cereate_at: { $regex: '^2026-01' } 
        }).limit(10);

        console.log('\nJanuary Products Check:');
        productsJan.forEach(p => {
            const amt = Number(p.amount);
            const tokens = Number(p.token_amount);
            const qty = Number(p.quantity || 1);
            const rate = (amt / tokens).toFixed(2);
            console.log(`- Date: ${p.cereate_at}, Amt: ${amt}, Tokens: ${tokens}, Qty: ${qty}, Implied Rate: ${rate}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
