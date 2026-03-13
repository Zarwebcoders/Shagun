const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

async function run() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log(`Checking ${products.length} products...`);
    
    products.forEach(p => {
        console.log(`- Product: ${p._id}, user_id: '${p.user_id}', Type: ${typeof p.user_id}, approve: ${p.approve}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
