const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LevelIncome = require('./models/LevelIncome');
const MonthlyTokenDistribution = require('./models/MonthlyTokenDistribution');
const User = require('./models/User');

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    console.log('\n--- EXTENDED VERIFICATION REPORT ---');

    const approvedProducts = await db.collection('products').find({
        $or: [{ approve: 1 }, { approve: '1' }, { approvel: 1 }, { approvel: '1' }]
    }).toArray();

    console.log(`✅ Total Approved Products: ${approvedProducts.length}`);

    let missingL0 = 0;
    for (const p of approvedProducts) {
        const count = await LevelIncome.countDocuments({ product_id: p._id });
        if (count === 0 && p.transcation_id !== '123456') { // Ignoring known test Tx
            console.log(`❌ MISSING INCOME for Tx: ${p.transcation_id} (ID: ${p._id})`);
            missingL0++;
        }
    }

    const liCount = await LevelIncome.countDocuments();
    const mtdCount = await MonthlyTokenDistribution.countDocuments();
    const usersWithIncome = await User.countDocuments({ total_income: { $gt: 0 } });

    console.log(`✅ Total Users with Income Updated: ${usersWithIncome}`);
    console.log(`✅ Total LevelIncome Records: ${liCount}`);
    console.log(`✅ Total Installments Scheduled: ${mtdCount}`);
    console.log(`✅ Total Missing L0 (excluding test): ${missingL0}`);

    if (missingL0 === 0) {
        console.log('\n🌟 ALL PROPER PRODUCTS HAVE BEEN PROCESSED SUCCESSFULLY!');
    } else {
        console.log(`\n⚠️  WARNING: ${missingL0} products might have failed. Check logs.`);
    }

    console.log('\n-------------------------------------');
    process.exit(0);
}

check().catch(err => { console.error(err); process.exit(1); });
