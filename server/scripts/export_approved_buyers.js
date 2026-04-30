const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function exportBuyers() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        // 1. Get unique user_ids from approved products
        const approvedProducts = await Product.find({ $or: [{ approve: 1 }, { approve: '1' }] });
        const buyerIds = [...new Set(approvedProducts.map(p => p.user_id))];

        console.log(`Found ${buyerIds.length} unique buyers linked to 259 approved products.`);

        // 2. Fetch user details
        const users = await User.find({ 
            $or: [
                { user_id: { $in: buyerIds } },
                { id: { $in: buyerIds } }
            ]
        });

        let csvContent = 'User ID,Full Name,Email,Referral ID,Sponsor ID,Password\n';

        users.forEach(u => {
            const row = [
                u.user_id || u.id || '',
                u.full_name || '',
                u.email || '',
                u.referral_id || '',
                u.sponsor_id || '',
                u.password || ''
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
            
            csvContent += row + '\n';
        });

        const outputPath = path.join(__dirname, '..', '..', 'artifacts', 'approved_buyers_list.csv');
        fs.writeFileSync(outputPath, csvContent);
        
        console.log(`Successfully exported buyers list to ${outputPath}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

exportBuyers();
