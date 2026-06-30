const mongoose = require('mongoose');
require('dotenv').config();

async function checkMatured() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const MonthlyTokenDistribution = mongoose.model('MonthlyTokenDistribution', new mongoose.Schema({}, { strict: false }));

        const user = await User.findOne({ referral_id: 'SGN91080' });
        if (!user) {
            console.log('User not found.');
            process.exit(0);
        }

        console.log(`User: ${user.full_name} | ID: ${user.id} | UserID: ${user.user_id} | _id: ${user._id}`);

        const now = new Date();
        
        // Find all distributions for this user
        const query = {
            $or: [
                { user_id: user._id },
                { user_id: user.id },
                { user_id: user.user_id },
                { user_id: user._id.toString() }
            ]
        };

        const dists = await MonthlyTokenDistribution.find(query);
        console.log(`\nFound ${dists.length} distribution records.`);

        let matured = 0;
        let pending = 0;
        let future = 0;

        dists.forEach(d => {
            const scheduled = new Date(d.scheduled_date);
            if (d.status === 'paid') {
                matured += d.monthly_amount;
                console.log(`- PAID: ₹${d.monthly_amount} (Scheduled: ${d.scheduled_date})`);
            } else {
                if (scheduled <= now) {
                    matured += d.monthly_amount;
                    console.log(`- MATURED (Pending Status): ₹${d.monthly_amount} (Scheduled: ${d.scheduled_date})`);
                } else {
                    future += d.monthly_amount;
                    console.log(`- FUTURE: ₹${d.monthly_amount} (Scheduled: ${d.scheduled_date})`);
                }
            }
        });

        console.log(`\nTotal Matured: ${matured}`);
        console.log(`Total Future: ${future}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMatured();
