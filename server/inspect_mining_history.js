require('dotenv').config();
const mongoose = require('mongoose');
const MiningBonus = require('./models/MiningBonus');
const User = require('./models/User');
const Product = require('./models/Product');
const Wallet = require('./models/Wallet');

async function run() {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ referral_id: 'SGN9784' });
        if (!user) {
            console.log('User Niti Vikas Shah (SGN9784) not found.');
            process.exit(0);
        }

        console.log(`User found: ${user.full_name} | ID: ${user.id} | User ID: ${user.user_id} | Referral ID: ${user.referral_id}`);
        console.log(`User stats:`);
        console.log(`  total_mining_count: ${user.total_mining_count}`);
        console.log(`  mining_count_thismounth: ${user.mining_count_thismounth}`);
        console.log(`  mining_bonus: ${user.mining_bonus}`);
        console.log(`  total_income: ${user.total_income}`);

        const walletIdentifiers = [...new Set([user._id.toString(), user.id, user.user_id].filter(Boolean).map(String))];
        const wallets = await Wallet.find({ user_id: { $in: walletIdentifiers } }).lean();
        console.log('User Wallets in DB:', JSON.stringify(wallets, null, 2));

        const products = await Product.find({ user_id: { $in: walletIdentifiers } }).lean();
        console.log('User Products in DB:', JSON.stringify(products, null, 2));

        const history = await MiningBonus.find({
            user_id: { $in: [user._id.toString(), user.id, user.user_id, user.referral_id].filter(Boolean) }
        }).sort({ created_at: -1 }).lean();
        console.log(`User Mining Bonuses count: ${history.length}`);
        console.log('User Mining Bonuses:', JSON.stringify(history, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
