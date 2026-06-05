const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const LevelIncome = require('./models/LevelIncome');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const emails = [
            'shahmanish@zoomintos.biz',
            'namrata@gmail.com',
            'devdhansharma27@gmail.com'
        ];

        console.log('--- USER INVESTIGATION ---');
        for (const email of emails) {
            const u = await User.findOne({ email }).lean();
            if (u) {
                console.log(`\nUser: ${u.full_name} (${u.user_id})`);
                console.log(`- Sponsor ID: ${u.sponsor_id}`);

                const products = await Product.find({
                    $or: [
                        { user_id: u._id },
                        { user_id: String(u._id) },
                        { user_id: u.id },
                        { user_id: u.user_id }
                    ]
                }).lean();
                console.log(`- Approved Products: ${products.filter(p => p.approve == 1 || p.approve == '1').length}`);

                const incomeCreatedForUpline = await LevelIncome.find({ from_user_id: { $in: [u.id, u.user_id] } }).lean();
                console.log(`- LevelIncome records generated FROM this user: ${incomeCreatedForUpline.length}`);
                if (incomeCreatedForUpline.length > 0) {
                    const receiverIds = [...new Set(incomeCreatedForUpline.map(i => i.user_id))];
                    console.log(`  - Receivers: ${receiverIds.join(', ')}`);
                }
            } else {
                console.log(`\nUser not found for email: ${email}`);
            }
        }

        const blankUser = await User.findOne({ email: 'blank@blank.com' }).lean();
        console.log(`\n--- BLANK USER ---`);
        console.log(`Referral ID: ${blankUser.referral_id}`);
        console.log(`id: ${blankUser.id}`);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
