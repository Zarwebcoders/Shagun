const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function verify() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Test Data
    const testEmail = `test_${Date.now()}@example.com`;
    const testSponsor = "SGN9001"; // Existing sponsor
    
    console.log('--- TESTING REGISTRATION LOGIC ---');
    
    // Simulation of ID generation logic from authController.js
    const allUsers = await User.find({}, { id: 1 }).lean();
    const maxId = allUsers
        .map(u => parseInt(u.id))
        .filter(n => !isNaN(n))
        .reduce((max, curr) => Math.max(max, curr), 0);
    
    const nextId = maxId + 1;
    const nextIdStr = String(nextId);
    const paddedId = String(nextId).padStart(3, '0');
    
    const newUserId = `SGN${paddedId}`;
    const newReferralId = `SGN9${paddedId}`;

    try {
        const user = await User.create({
            full_name: "Test Entry",
            email: testEmail,
            mobile: "9999999999",
            password: "password123",
            user_id: newUserId,
            id: nextIdStr,
            referral_id: newReferralId,
            sponsor_id: testSponsor,
            // Initializing fields from image
            airdrop_tokons: "0",
            real_tokens: "0",
            shopping_tokons: "0",
            mining_bonus: 0,
            anual_bonus: "0",
            sponsor_income: "0",
            level_income: 0,
            total_income: 0,
            mining_count_thismounth: "0",
            last_mining_data: "",
            is_admin: "0",
            is_deleted: "0",
            level_income_withdrawn_count: 0
        });

        console.log('✅ User registered successfully!');
        
        // Fetch raw document to verify fields
        const rawUser = await mongoose.connection.db.collection('users').findOne({ _id: user._id });
        
        const requiredFields = [
            'user_id', 'id', 'email', 'mobile', 'full_name', 'referral_id', 'sponsor_id',
            'airdrop_tokons', 'real_tokens', 'shopping_tokons', 'mining_bonus', 'anual_bonus',
            'sponsor_income', 'level_income', 'total_income', 'last_mining_data',
            'mining_count_thismounth', 'create_at', 'update_at', 'password', 'is_admin',
            'is_deleted', 'level_income_withdrawn_count'
        ];

        let missing = [];
        requiredFields.forEach(field => {
            if (rawUser[field] === undefined) missing.push(field);
        });

        if (missing.length === 0) {
            console.log('✅ All requested fields are present in the database document.');
            console.log('\nVerification of field types:');
            console.log('- airdrop_tokons:', typeof rawUser.airdrop_tokons, `("${rawUser.airdrop_tokons}")`);
            console.log('- sponsor_id:', typeof rawUser.sponsor_id, `("${rawUser.sponsor_id}")`);
            console.log('- user_id:', rawUser.user_id);
            console.log('- id:', rawUser.id);
        } else {
            console.error('❌ Missing fields:', missing.join(', '));
        }

        // Cleanup
        await User.deleteOne({ _id: user._id });
        console.log('\n--- VERIFICATION COMPLETE ---');
        process.exit(0);

    } catch (error) {
        console.error('❌ Registration failed:', error.message);
        process.exit(1);
    }
}

verify();
