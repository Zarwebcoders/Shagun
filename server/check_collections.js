const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`Collection ${col.name}: ${count} docs`);
            if (count > 0) {
                const sample = await db.collection(col.name).findOne({});
                console.log(`Sample from ${col.name}:`, JSON.stringify(sample, null, 2));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
