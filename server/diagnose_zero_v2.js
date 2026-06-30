const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        const emails = ['namrata@gmail.com', 'shahprajesh@gmail.com', 'gandhihemangini260@gmail.com', 'patelmahendra2006@gmail.com', 'maheshgandhi2009@gmail.com', 'admin@zoomintos.biz'];

        for (const email of emails) {
            const u = await User.findOne({ email });
            if (!u) {
                console.log(`\nNOT FOUND: ${email}`);
                continue;
            }

            const uStrId = String(u.id || u.user_id || '');
            const uNumId = Number(u.id) || 0;

            // Cast-safe search using all string variants
            const products = await db.collection('products').find({
                $or: [
                    { user_id: u._id },
                    { user_id: String(u._id) },
                    { user_id: uStrId },
                    { user_id: uNumId }
                ],
                $and: [{
                    $or: [{ approve: 1 }, { approve: '1' }, { approvel: 1 }, { approvel: '1' }]
                }]
            }).toArray();

            console.log(`\n${u.full_name} (${email}) | DB Products: ${products.length}`);
            for (const p of products) {
                console.log(`  - Tx: ${p.transcation_id} | user_id in DB: "${p.user_id}" | type: ${typeof p.user_id}`);
            }

            if (products.length === 0) {
                console.log(`  --> Member has NO approved purchases. Zero income is LEGITIMATE.`);
            }
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
