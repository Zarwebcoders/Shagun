const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const LevelIncome = require('../models/LevelIncome');

async function dumpIncomes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const docs = await LevelIncome.find({}).limit(100).lean();
        fs.writeFileSync(path.join(__dirname, 'level_incomes_dump.json'), JSON.stringify(docs, null, 2));
        console.log('Dumped 100 records to level_incomes_dump.json');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

dumpIncomes();
