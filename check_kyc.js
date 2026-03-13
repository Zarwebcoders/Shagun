const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'server', '.env') });
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const kyc = await mongoose.connection.db.collection('kycs').findOne({});
  console.log(JSON.stringify(kyc, null, 2));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
