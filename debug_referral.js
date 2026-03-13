const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const user1 = await mongoose.connection.db.collection('users').findOne({ email: 'testuser@gmail.com' });
    const user2 = await mongoose.connection.db.collection('users').findOne({ email: 'testusertwo@gmail.com' });

    console.log('Test User:', JSON.stringify(user1, null, 2));
    console.log('Test User Two:', JSON.stringify(user2, null, 2));

    if (user2) {
        const product2 = await mongoose.connection.db.collection('products').find({ user_id: { $in: [user2.id, user2.user_id, user2._id.toString()] } }).toArray();
        console.log('Test User Two Products:', JSON.stringify(product2, null, 2));
        
        const distributions = await mongoose.connection.db.collection('monthlytokendistributions').find({ from_purchase_id: { $in: product2.map(p => p._id.toString()) } }).toArray();
        console.log('Distributions from User Two purchases:', JSON.stringify(distributions, null, 2));

        const levelIncomes = await mongoose.connection.db.collection('levelincomes').find({ from_user_id: user2._id.toString() }).toArray();
        console.log('Level Incomes from User Two:', JSON.stringify(levelIncomes, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
