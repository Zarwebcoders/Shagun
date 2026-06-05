const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const findInactiveEarners = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // 1. Find all users with sponsor income > 0
        const earners = await User.find({ sponsor_income: { $gt: 0 } });
        console.log(`Checking ${earners.length} users who have sponsor income...`);

        let inactiveCount = 0;

        for (const user of earners) {
            // 2. Check if this earner has any approved products (Active status)
            const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(id => id).map(id => String(id));
            
            const hasApprovedProduct = await Product.findOne({
                user_id: { $in: queryIds },
                $or: [{ approve: 1 }, { approve: "1" }]
            });

            if (!hasApprovedProduct) {
                console.log(`\n[INACTIVE EARNER] ${user.full_name} (${user.referral_id})`);
                console.log(`  - Sponsor Income: ₹${user.sponsor_income}`);
                console.log(`  - Total Income:   ₹${user.total_income}`);
                console.log(`  - Status: No approved products found.`);
                inactiveCount++;
            }
        }

        console.log(`\nFound ${inactiveCount} inactive earners.`);
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

findInactiveEarners();
