const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function exportReports() {
    try {
        const User = require('../models/User');
        const LevelIncome = require('../models/LevelIncome');
        const ReferralIncomes = require('../models/ReferralIncomes');

        const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB. Exporting reports...');

        const cutOffDate = new Date(2026, 1, 28); // Feb 28, 2026

        // --- 1. Level Income Report ---
        console.log('Generating Level Income Report...');
        const levelIncomes = await LevelIncome.find({ create_at: { $gte: cutOffDate } }).sort({ create_at: 1 });
        
        let levelCsv = 'Date,Earner ID,Earner Name,From User ID,Level,Amount (Tokens),Product ID\n';
        for (const record of levelIncomes) {
            const earner = await User.findOne({ $or: [{ id: record.user_id }, { user_id: record.user_id }] });
            const fromUser = await User.findOne({ $or: [{ id: record.from_user_id }, { user_id: record.from_user_id }] });
            
            const dateStr = record.create_at ? new Date(record.create_at).toLocaleDateString() : '';
            const earnerName = earner ? earner.full_name : 'Unknown';
            
            levelCsv += `"${dateStr}","${record.user_id}","${earnerName}","${record.from_user_id}","${record.level}","${record.amount.toFixed(2)}","${record.product_id}"\n`;
        }
        fs.writeFileSync(path.join(__dirname, '../new_level_income_report.csv'), levelCsv);
        console.log('Level Income report saved to new_level_income_report.csv');

        // --- 2. Referral Income Report ---
        console.log('Generating Referral Income Report...');
        const referralIncomes = await ReferralIncomes.find({}).sort({ create_at: 1 }); // All because we just synced them
        
        let refCsv = 'Date,Earner ID,Earner Name,Referred User ID,Product Amount,Referral Amount (8%),Status\n';
        for (const record of referralIncomes) {
            const earner = await User.findOne({ $or: [{ id: record.earner_user_id }, { user_id: record.earner_user_id }, { _id: mongoose.Types.ObjectId.isValid(record.earner_user_id) ? record.earner_user_id : null }] });
            const earnerName = earner ? earner.full_name : 'Unknown';
            
            const dateStr = record.create_at ? new Date(record.create_at).toLocaleDateString() : '';
            
            refCsv += `"${dateStr}","${record.earner_user_id}","${earnerName}","${record.referred_user_id}","${record.amount}","${record.referral_amount}","${record.status}"\n`;
        }
        fs.writeFileSync(path.join(__dirname, '../new_referral_income_report.csv'), refCsv);
        console.log('Referral Income report saved to new_referral_income_report.csv');

        console.log('\n--- EXPORT COMPLETED ---');
        process.exit(0);
    } catch (err) {
        console.error('Export Error:', err);
        process.exit(1);
    }
}

exportReports();
