const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const exportToCSV = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const users = await User.find({
            $or: [
                { sponsor_income: { $gt: 0 } },
                { level_income: { $gt: 0 } },
                { total_income: { $gt: 0 } }
            ]
        });

        console.log(`Auditing ${users.length} users...`);

        const csvRows = [
            'Referral ID,Full Name,Email,Sponsor ID,Sponsor Income,Level Income,Total Income,Airdrop Tokens,Approved Products,Status'
        ];

        let count = 0;
        for (const user of users) {
            const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(id => id).map(id => String(id));
            
            // Count approved products
            const approvedProductsCount = await Product.countDocuments({
                user_id: { $in: queryIds },
                $or: [{ approve: 1 }, { approve: "1" }]
            });

            const status = approvedProductsCount > 0 ? 'ACTIVE' : 'INACTIVE';

            const row = [
                user.referral_id || 'N/A',
                `"${user.full_name}"`,
                user.email,
                user.sponsor_id || 'N/A',
                user.sponsor_income || 0,
                user.level_income || 0,
                user.total_income || 0,
                user.airdrop_tokons || 0,
                approvedProductsCount,
                status
            ].join(',');
            csvRows.push(row);
            count++;
        }

        const filePath = path.join(__dirname, '../inactive_earners_list.csv');
        fs.writeFileSync(filePath, csvRows.join('\n'));
        
        console.log(`\nSuccess! Created CSV with ${count} users.`);
        console.log(`Path: ${filePath}`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

exportToCSV();
