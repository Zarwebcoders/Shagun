const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');

async function run() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI is missing');

        console.log('Connecting to database...');
        await mongoose.connect(uri);
        console.log('Connected.');

        // Find all LevelIncome records
        const incomes = await LevelIncome.find({ level: { $gt: 0 } }).lean();
        console.log(`Found ${incomes.length} LevelIncome records to process.`);

        let correctedCount = 0;

        for (const inc of incomes) {
            const recipient = await User.findOne({
                $or: [
                    { id: inc.user_id },
                    { user_id: inc.user_id },
                    { _id: mongoose.Types.ObjectId.isValid(inc.user_id) ? new mongoose.Types.ObjectId(inc.user_id) : null }
                ].filter(q => q._id !== null || q.id || q.user_id)
            });

            if (!recipient) {
                console.log(`Warning: Recipient not found for LevelIncome ${inc._id}`);
                continue;
            }

            const buyer = await User.findOne({
                $or: [
                    { id: inc.from_user_id },
                    { user_id: inc.from_user_id },
                    { _id: mongoose.Types.ObjectId.isValid(inc.from_user_id) ? new mongoose.Types.ObjectId(inc.from_user_id) : null }
                ].filter(q => q._id !== null || q.id || q.user_id)
            });

            // Find all distributions for this level income
            const dists = await MonthlyTokenDistribution.find({
                user_id: recipient._id,
                from_purchase_id: new mongoose.Types.ObjectId(inc.product_id),
                level: inc.level
            });

            const expectedInstallment = inc.amount / 24;

            // Check if there are duplicates (count != 24) or if the installment amounts are incorrect
            const hasDiscrepancy = dists.length !== 24 || dists.some(d => Math.abs(d.monthly_amount - expectedInstallment) > 0.001);

            if (hasDiscrepancy) {
                console.log(`\nCorrecting discrepancy for LevelIncome ${inc._id}:`);
                console.log(`  Recipient: ${recipient.email} | Level: ${inc.level}`);
                console.log(`  Total Income (LevelIncome amount): ${inc.amount}`);
                console.log(`  Expected installment amount: ${expectedInstallment}`);
                console.log(`  Current distributions count: ${dists.length}`);
                
                // Delete old distributions
                const delRes = await MonthlyTokenDistribution.deleteMany({
                    user_id: recipient._id,
                    from_purchase_id: new mongoose.Types.ObjectId(inc.product_id),
                    level: inc.level
                });
                console.log(`  Deleted ${delRes.deletedCount} incorrect/duplicate distributions.`);

                // Re-create the 24 correct distributions
                const baseDate = inc.create_at || inc.created_at || new Date();
                const now = new Date();
                const newDists = [];

                for (let i = 1; i <= 24; i++) {
                    const scheduledDate = new Date(baseDate);
                    scheduledDate.setDate(scheduledDate.getDate() + ((i - 1) * 15));

                    let status = 'pending';
                    if (scheduledDate <= now) {
                        status = 'paid';
                    }

                    newDists.push({
                        user_id: recipient._id,
                        from_purchase_id: new mongoose.Types.ObjectId(inc.product_id),
                        from_user_id: buyer ? buyer._id : recipient._id,
                        level: inc.level,
                        monthly_amount: expectedInstallment,
                        month_number: i,
                        status: status,
                        scheduled_date: scheduledDate
                    });
                }

                await MonthlyTokenDistribution.insertMany(newDists);
                console.log(`  Created 24 new correct distributions.`);
                correctedCount++;
            }
        }

        console.log(`\nCleanup completed! Corrected distributions for ${correctedCount} LevelIncome records.`);
        process.exit(0);
    } catch (err) {
        console.error('CRITICAL ERROR DURING CLEANUP:', err);
        process.exit(1);
    }
}
run();
