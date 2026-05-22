const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Investment = require('./models/Investment');
const Withdrawal = require('./models/Withdrawal');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const i = await Investment.findOne().lean();
        if (i) console.log(`Investment Amount: ${i.amount} (Type: ${typeof i.amount})`);

        const w = await Withdrawal.findOne().lean();
        if (w) console.log(`Withdrawal Amount: ${w.amount} (Type: ${typeof w.amount})`);

        process.exit();
    } catch (e) { console.error(e); process.exit(1); }
};
run();
