const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const approvedCount = await db.collection('products').countDocuments({
            $or: [
                { approve: 1 },
                { approve: '1' },
                { approvel: 1 },
                { approvel: '1' }
            ]
        });

        const uniqueUsers = await db.collection('products').distinct('user_id', {
            $or: [
                { approve: 1 },
                { approve: '1' },
                { approvel: 1 },
                { approvel: '1' }
            ]
        });

        console.log(`Total Approved Products: ${approvedCount}`);
        console.log(`Unique Purchasers: ${uniqueUsers.length}`);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
