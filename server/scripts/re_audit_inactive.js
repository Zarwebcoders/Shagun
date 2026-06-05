const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const reAudit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find ALL users who have ANY income (sponsor or level)
        const users = await User.find({
            $or: [
                { sponsor_income: { $gt: 0 } },
                { level_income: { $gt: 0 } },
                { total_income: { $gt: 0 } }
            ]
        });

        console.log(`Auditing ${users.length} users with any income...`);

        let inactiveCount = 0;
        for (const user of users) {
            const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(id => id).map(id => String(id));
            
            const hasApprovedProduct = await Product.findOne({
                user_id: { $in: queryIds },
                $or: [{ approve: 1 }, { approve: "1" }]
            });

            if (!hasApprovedProduct) {
                console.log(`[INACTIVE] ${user.referral_id} (${user.full_name}) - SI: ${user.sponsor_income}, LI: ${user.level_income}`);
                inactiveCount++;
            }
        }

        console.log(`\nTotal Inactive Earners Found: ${inactiveCount}`);
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

reAudit();
