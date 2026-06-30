const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');

const fs = require('fs');
const logFile = path.join(__dirname, 'debug_manoj_results.txt');
fs.writeFileSync(logFile, ''); // Clear log

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function debugManoj() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        log('Connected to DB');

        const manojEmail = 'choure.manoj69@gmail.com';
        const manoj = await User.findOne({ email: manojEmail });

        if (!manoj) {
            log('Manoj not found');
            return;
        }

        log(`Manoj Info: Name=${manoj.full_name}, ID=${manoj.id}, user_id=${manoj.user_id}, _id=${manoj._id}, sponsor_id=${manoj.sponsor_id}`);

        // Find Manoj's sponsor
        if (manoj.sponsor_id) {
            const sponsor = await User.findOne({
                $or: [
                    { id: manoj.sponsor_id },
                    { user_id: manoj.sponsor_id },
                    { referral_id: manoj.sponsor_id }
                ]
            });

            if (sponsor) {
                log(`Manoj's Direct Sponsor: ${sponsor.full_name} (${sponsor.email}), ID=${sponsor.id}, user_id=${sponsor.user_id}, sponsor_id=${sponsor.sponsor_id}`);

                // Find Sponsor's sponsor
                if (sponsor.sponsor_id) {
                    const grandSponsor = await User.findOne({
                        $or: [
                            { id: sponsor.sponsor_id },
                            { user_id: sponsor.sponsor_id },
                            { referral_id: sponsor.sponsor_id }
                        ]
                    });
                    if (grandSponsor) {
                        log(`Manoj's Grand Sponsor (Level 2 recipient): ${grandSponsor.full_name} (${grandSponsor.email}), ID=${grandSponsor.id}`);
                    }
                }
            } else {
                log(`Manoj's sponsor_id (${manoj.sponsor_id}) does not match any user.`);
            }
        } else {
            log('Manoj has no sponsor_id');
        }

        // Find LevelIncome records where Manoj is "from_user_id"
        // Note: from_user_id in LevelIncome model is likely the legacy ID (string)
        const manojLegacyId = manoj.id || manoj.user_id;
        const incomes = await LevelIncome.find({ from_user_id: manojLegacyId });

        log(`Found ${incomes.length} income records from Manoj:`);
        for (const inc of incomes) {
            const recipient = await User.findOne({
                $or: [{ id: inc.user_id }, { user_id: inc.user_id }]
            });
            log(`- Recipient: ${recipient ? recipient.full_name : inc.user_id} (${recipient ? recipient.email : ''}), Level: ${inc.level}, Amount: ${inc.amount}`);
        }

    } catch (err) {
        log('Error: ' + err.message);
    } finally {
        await mongoose.disconnect();
    }
}

debugManoj();
