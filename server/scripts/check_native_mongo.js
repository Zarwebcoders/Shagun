require('dotenv').config({ path: '../.env' });
const { MongoClient } = require('mongodb');

async function run() {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        const db = client.db(); // It defaults to DB from URI
        const products = db.collection('products');

        const countRawNum = await products.countDocuments({ approve: 1 });
        const countRawStr = await products.countDocuments({ approve: '1' });
        const countRawNumEl = await products.countDocuments({ approvel: 1 });
        const countRawStrEl = await products.countDocuments({ approvel: '1' });

        console.log('approve Numer 1:', countRawNum);
        console.log('approve String 1:', countRawStr);
        console.log('approvel Numer 1:', countRawNumEl);
        console.log('approvel String 1:', countRawStrEl);

        // Find one product to inspect its raw approve type:
        const sample = await products.findOne({});
        console.log('Sample approve:', sample.approve, '| type:', typeof sample.approve);
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
run();
