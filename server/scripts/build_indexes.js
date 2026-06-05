const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // Load all models to register their schemas with indexes
        const User = require('../models/User');
        const Product = require('../models/Product');
        const MiningBonus = require('../models/MiningBonus');
        const ReferralIncomes = require('../models/ReferralIncomes');
        const LevelIncome = require('../models/LevelIncome');
        const Notification = require('../models/Notification');
        const KYC = require('../models/KYC');
        const Withdrawal = require('../models/Withdrawal');
        const MyAccount = require('../models/MyAccount');
        const Payment = require('../models/Payment');
        const Wallet = require('../models/Wallet');
        const VendorKYC = require('../models/VendorKYC');
        const VendorWithdraw = require('../models/VendorWithdraw');
        const VendorWallet = require('../models/VendorWallet');
        const VendorAccount = require('../models/VendorAccount');
        const Investment = require('../models/Investment');

        const models = [
            User, Product, MiningBonus, ReferralIncomes, LevelIncome,
            Notification, KYC, Withdrawal, MyAccount, Payment, Wallet,
            VendorKYC, VendorWithdraw, VendorWallet, VendorAccount, Investment
        ];

        console.log("Syncing indexes for all models...");
        for (const model of models) {
            console.log(`Syncing indexes for ${model.modelName}...`);
            const result = await model.syncIndexes();
            console.log(`Sync complete for ${model.modelName}. Changes:`, result);
        }
        console.log("All indexes synced successfully.");
        process.exit(0);
    } catch (error) {
        console.error(`Error syncing indexes: ${error.message}`);
        process.exit(1);
    }
};

connectDB();
