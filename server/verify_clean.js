const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const u = await User.findOne({ email: 'blank@blank.com' });
        const data = await User.aggregate([
            { $match: { _id: u._id } },
            {
                $graphLookup: {
                    from: 'users',
                    startWith: '$referral_id',
                    connectFromField: 'referral_id',
                    connectToField: 'sponsor_id',
                    as: 'net',
                    maxDepth: 2,
                    depthField: 'depth'
                }
            }
        ]);

        console.log('--- VERIFICATION START ---');
        if (data.length > 0) {
            console.log('Count:', data[0].net.length);
            data[0].net.forEach(n => {
                console.log(`USER: ${n.user_id} | NAME: ${n.full_name} | SPONSOR: ${n.sponsor_id} | DEPTH: ${n.depth}`);
            });
        }
        console.log('--- VERIFICATION END ---');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
