require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
    const db = mongoose.connection.db;
    const agg = await db.collection('products').aggregate([
        { $group: { _id: '$approve', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]).toArray();
    console.log('Product approve values distribution:');
    console.table(agg);
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
