const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const crypto = require('crypto');

dotenv.config();

async function verify() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = "dilipgandhi25@gmail.com"; // Existing user
    console.log(`--- Testing Forgot Password for ${email} ---`);
    
    // Simulate the forgotPassword controller logic
    const user = await User.findOne({ email });
    if (!user) {
        console.error('User not found');
        process.exit(1);
    }
    
    // Clear any existing tokens first
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // 1. Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // 2. Update user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 5 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    console.log('✅ Token generated and saved to database.');
    
    // 3. Verify in DB
    const updatedUser = await User.findOne({ email });
    console.log('Verification:');
    console.log('- Token in DB:', updatedUser.resetPasswordToken);
    console.log('- Expiry in DB:', updatedUser.resetPasswordExpire);
    console.log('- Is expiry > now?', updatedUser.resetPasswordExpire > Date.now());
    
    if (updatedUser.resetPasswordToken === hashedToken && updatedUser.resetPasswordExpire > Date.now()) {
        console.log('✅ BACKEND LOGIC VERIFIED SUCCESSFULLY');
    } else {
        console.error('❌ BACKEND LOGIC VERIFICATION FAILED');
    }
    
    process.exit(0);
}

verify();
