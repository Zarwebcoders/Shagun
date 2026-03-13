const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const products = await mongoose.connection.db.collection('products').find({}).sort({cereate_at: -1}).limit(5).toArray();
    console.log('Recent Products:', JSON.stringify(products, null, 2));
    
    if (products.length > 0) {
        const userId = products[0].user_id;
        const user = await mongoose.connection.db.collection('users').findOne({ 
            $or: [{ id: userId }, { user_id: userId }, { _id: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null }] 
        });
        console.log('Associated User:', JSON.stringify(user, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
