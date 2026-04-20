const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function getSGN9282Cycles() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const user_ids = ['SGN9282', '282', 'SGN282'];

        const products = await mongoose.connection.db.collection('products').find({
            user_id: { $in: user_ids },
            approve: { $in: [1, '1'] }
        }).toArray();

        console.log(`Matched Products: ${products.length}`);
        
        let maxCycle = 0;
        let totalCycles = 24;

        products.forEach(p => {
            console.log(`Product ID: ${p.id} | Package: ${p.packag_type}`);
            console.log(`  Cycle Count: ${p.cycle_count}`);
            console.log(`  Total Cycles: ${p.total_cycles}`);
            if (Number(p.cycle_count) > maxCycle) maxCycle = Number(p.cycle_count);
        });

        console.log(`\nFinal Verdict for Dashboard: ${maxCycle} / ${totalCycles}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

getSGN9282Cycles();
