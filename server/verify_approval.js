const mongoose = require('mongoose');
const Withdrawal = require('./models/Withdrawal');
const User = require('./models/User');
require('dotenv').config();

async function verifyApproval() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find recent withdrawals
        const withdrawals = await Withdrawal.find({}).sort({ create_at: -1 }).limit(3);
        console.log('Recent Withdrawals:');
        for (const w of withdrawals) {
            const u = await User.findOne({
                $or: [
                    { id: w.user_id },
                    { user_id: w.user_id },
                    { _id: mongoose.isValidObjectId(w.user_id) ? w.user_id : null }
                ].filter(q => q.id || q.user_id || q._id)
            });
            console.log(`- ID: ${w._id}, User: ${u?.email || w.user_id}, Amount: ${w.amount}, Status: ${w.approve} (${typeof w.approve}), Date: ${w.create_at}`);
            if (u) {
                console.log(`  User Balance: Level=${u.level_income}, Mining=${u.mining_bonus}`);
            }
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
verifyApproval();
