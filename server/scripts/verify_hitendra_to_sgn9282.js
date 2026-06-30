const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const LevelIncome = require('../models/LevelIncome');

async function checkSGN9282() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // SGN9282's IDs
        const earner_ids = ['SGN282', '282', 'SGN9282'];
        // Mahendrakumar's IDs
        const buyer_ids = ['SGN951', '954', '69d4a8ed97d64f202a89540c'];

        const incomes = await LevelIncome.find({ 
            user_id: { $in: earner_ids },
            from_user_id: { $in: buyer_ids }
        });

        console.log(`Matching Income Records: ${incomes.length}`);
        
        let grandTotal = 0;
        incomes.forEach(inc => {
            console.log(`Product ID: ${inc.product_id}`);
            console.log(`  Amount (SGN): ${inc.amount}`);
            console.log(`  Level: ${inc.level}`);
            grandTotal += inc.amount;
        });

        console.log(`\nGrand Total for SGN9282 from Hitendra: ${grandTotal}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkSGN9282();
