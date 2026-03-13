const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        let currentUserId = '771';
        console.log('--- SPONSOR HIERARCHY FOR 771 ---');

        for (let i = 1; i <= 5; i++) {
            const user = await User.findOne({
                $or: [
                    { id: currentUserId },
                    { user_id: currentUserId },
                    { referral_id: currentUserId }
                ]
            });
            if (!user) {
                console.log(`User ${currentUserId} not found`);
                break;
            }
            console.log(`Level ${i - 1}: ${user.full_name} (${user.email}) | ID:${user.id} | UserID:${user.user_id} | RefID:${user.referral_id} | Sponsor:${user.sponsor_id}`);

            if (!user.sponsor_id) {
                console.log('No more sponsors.');
                break;
            }
            currentUserId = user.sponsor_id;
        }

        process.exit();
    } catch (e) {
        process.exit(1);
    }
};

run();
