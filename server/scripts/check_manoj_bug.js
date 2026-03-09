const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');

async function checkManojIncome() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const manojLegacyId = 'SGN047'; // Based on previous debug
        const incomes = await LevelIncome.find({ from_user_id: manojLegacyId });

        console.log(`Checking ${incomes.length} records for Manoj...`);

        for (const inc of incomes) {
            const monthly = inc.amount / 12;
            console.log(`- ID: ${inc._id}, Recipient: ${inc.user_id}, Level: ${inc.level}, Total: ${inc.amount}, Monthly: ${monthly}`);

            // Check for the SGN 2250 entry
            if (Math.abs(monthly - 2250) < 1) {
                console.log('  >>> FOUND THE SGN 2250 ENTRY!');
                const recipient = await User.findOne({
                    $or: [{ id: inc.user_id }, { user_id: inc.user_id }, { referral_id: inc.user_id }]
                });

                if (recipient) {
                    console.log(`  Recipient Details: ${recipient.full_name}, Email: ${recipient.email}, Sponsor: ${recipient.sponsor_id}`);

                    // Check Manoj's sponsor
                    const manoj = await User.findOne({ user_id: manojLegacyId });
                    if (manoj) {
                        console.log(`  Manoj Sponsor: ${manoj.sponsor_id}`);

                        // If Manoj's sponsor is the recipient, it MUST be level 1 and 3.6%
                        if (manoj.sponsor_id === recipient.user_id || manoj.sponsor_id === recipient.id || manoj.sponsor_id === recipient.referral_id) {
                            console.log('  BUG CONFIRMED: Manoj is Level 1 for this user, but got 1.8%');
                        } else {
                            console.log('  Interesting: Recipient is NOT Manoj\'s direct sponsor, but record says Level 1? Or is it Level 2?');
                        }
                    }
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkManojIncome();
