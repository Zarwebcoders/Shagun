require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Document counts per collection:');
    for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments({});
        console.log(`- ${coll.name}: ${count}`);
    }
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
