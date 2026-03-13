const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const LevelIncome = require('./models/LevelIncome');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const incs = await LevelIncome.find({ user_id: '7' }).sort({ from_user_id: 1 }).lean();

        let report = `--- FINAL INCOME REPORT FOR USER 7 (blank@blank.com) ---\n\n`;
        report += `Total Records: ${incs.length}\n\n`;

        for (const inc of incs) {
            const u = await User.findOne({ $or: [{ id: inc.from_user_id }, { user_id: inc.from_user_id }] });
            const annual = inc.amount;
            const monthly = annual / 12;
            const name = u ? u.full_name : `ID:${inc.from_user_id}`;
            const ref = u ? u.referral_id || u.user_id : 'Unknown';

            report += `From: ${name} (${ref})\n`;
            report += `- Level: ${inc.level}\n`;
            report += `- Annual Amount (12 months): ₹${annual.toFixed(2)}\n`;
            report += `- Monthly Amount: ₹${monthly.toFixed(2)}\n`;
            report += `- Product ID: ${inc.product_id}\n`;
            report += `-------------------------------------------\n`;
        }

        const mainUser = await User.findOne({ id: '7' });
        report += `\nMain User Dynamic Balances:\n`;
        report += `- Level Income: ₹${mainUser.level_income.toFixed(2)}\n`;
        report += `- Total Income: ₹${mainUser.total_income.toFixed(2)}\n`;

        fs.writeFileSync('final_income_report.txt', report);
        console.log('Final report written to final_income_report.txt');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
