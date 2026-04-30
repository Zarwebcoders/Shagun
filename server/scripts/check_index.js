const mongoose = require('mongoose');
require('dotenv').config();

async function checkIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const users = await User.find({ is_admin: { $ne: '1' } }).sort({ create_at: 1 });
        
        const sgn004 = users.findIndex(u => u.user_id === 'SGN004');
        const sgn003 = users.findIndex(u => u.user_id === 'SGN003');
        const sgn001 = users.findIndex(u => u.user_id === 'SGN001');

        console.log(`SGN001 Index: ${sgn001}`);
        console.log(`SGN003 Index: ${sgn003}`);
        console.log(`SGN004 Index: ${sgn004}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkIndex();
