const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function findSponsor() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const buyer = await User.findOne({ email: 'testusertwo@gmail.com' });
        if (buyer) {
            console.log(`Buyer: ${buyer.email}, Sponsor ID: ${buyer.sponsor_id}`);
            const sponsor = await User.findOne({
                $or: [
                    { id: buyer.sponsor_id },
                    { user_id: buyer.sponsor_id },
                    { _id: buyer.sponsor_id }
                ].filter(q => q.id || q.user_id || require('mongoose').Types.ObjectId.isValid(q._id))
            });
            
            if (sponsor) {
                console.log(`Sponsor found: ${sponsor.email}, Balance: ${sponsor.level_income}`);
            } else {
                console.log('Sponsor not found in DB');
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
findSponsor();
