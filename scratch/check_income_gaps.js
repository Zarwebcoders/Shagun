import mongoose from 'mongoose';
import User from '../server/models/User.js';
import Product from '../server/models/Product.js';
import LevelIncome from '../server/models/LevelIncome.js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

async function checkGaps() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shagun';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const products = await Product.find({ approve: 1 }).sort({ cereate_at: -1 }).limit(10);
        console.log(`Checking last ${products.length} approved products...`);

        for (const p of products) {
            const incomeCount = await LevelIncome.countDocuments({ product_id: p._id });
            const buyer = await User.findOne({ $or: [{ id: p.user_id }, { user_id: p.user_id }, { _id: mongoose.Types.ObjectId.isValid(p.user_id) ? p.user_id : null }] });
            
            console.log(`Product: ${p._id} | Amount: ${p.amount} | Buyer: ${buyer?.email || p.user_id} | Incomes Found: ${incomeCount}`);
            
            if (incomeCount <= 1) { // Usually 1 is for the buyer self-ROI
                console.log(`  --> Potential GAP found for product ${p._id}`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkGaps();
