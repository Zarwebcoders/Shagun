const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const LevelIncome = require('../models/LevelIncome');
const User = require('../models/User');

async function findManojIncomes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const manoj = await User.findOne({ email: 'choure.manoj69@gmail.com' });
        if (!manoj) {
            console.log('Manoj not found');
            return;
        }

        const ids = [manoj.id, manoj.user_id, manoj.referral_id, String(manoj._id)].filter(id => id);
        console.log('Searching for IDs:', ids);

        const docs = await LevelIncome.find({
            from_user_id: { $in: ids }
        }).lean();

        fs.writeFileSync(path.join(__dirname, 'manoj_incomes_found.json'), JSON.stringify(docs, null, 2));
        console.log(`Found ${docs.length} records for Manoj.`);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

findManojIncomes();
