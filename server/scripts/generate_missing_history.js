const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const ReferralIncomes = require('../models/ReferralIncomes');
const Transaction = require('../models/Transaction');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Robustly find a user by any ID (ObjectId, user_id, or legacy id)
 */
const findUserRobustly = async (id) => {
    if (!id) return null;
    if (mongoose.Types.ObjectId.isValid(id)) {
        const user = await User.findById(id);
        if (user) return user;
    }
    return await User.findOne({
        $or: [
            { user_id: id },
            { id: id },
            { referral_id: id }
        ]
    });
};

const runAudit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const approvedProducts = await Product.find({ 
            $or: [
                { approve: 1 },
                { approve: "1" }
            ]
        });
        console.log(`Found ${approvedProducts.length} approved products. Checking for missing history...`);

        let fixedCount = 0;

        for (const product of approvedProducts) {
            // Find buyer first to get their ID for the history check
            const buyer = await findUserRobustly(product.user_id);
            if (!buyer) {
                console.log(`\n[SKIP] Buyer ${product.user_id} not found for Product ${product._id}`);
                continue;
            }

            const buyerId = String(buyer.id || buyer.user_id || buyer._id);

            // Check if referral income record exists for this SPECIFIC buyer and product/txn
            const hasHistory = await ReferralIncomes.findOne({
                referred_user_id: buyerId,
                $or: [
                    { product_id: String(product._id) },
                    { product_transcation_id: product.transcation_id }
                ]
            });

            if (!hasHistory) {
                console.log(`\n[FIXING] Missing history for Product: ${product._id}, User: ${product.user_id}`);
                
                // 1. Find Sponsor (Buyer is already found above)
                if (!buyer.sponsor_id) {
                    console.log(`  - No sponsor found for buyer. Skipping.`);
                    continue;
                }

                // 2. Find Sponsor
                const sponsor = await findUserRobustly(buyer.sponsor_id);
                if (!sponsor) {
                    console.log(`  - Sponsor ${buyer.sponsor_id} not found. Skipping.`);
                    continue;
                }

                const productAmount = product.amount * product.quantity;
                const referralIncome = (productAmount * 8) / 100;

                console.log(`  - Crediting Sponsor: ${sponsor.email}, Amount: ₹${referralIncome}`);

                // 3. Create ReferralIncomes Record
                const earnerId = sponsor.id || sponsor.user_id || sponsor._id.toString();
                const referredId = buyer.id || buyer.user_id || buyer._id.toString();

                await ReferralIncomes.create({
                    earner_user_id: String(earnerId),
                    referred_user_id: String(referredId),
                    product_id: String(product._id),
                    product_transcation_id: product.transcation_id || `REF${Date.now()}`,
                    amount: productAmount,
                    percentage: 8.00,
                    referral_amount: referralIncome,
                    status: 'credited'
                });

                // 4. Create Transaction Record
                await Transaction.create({
                    user: sponsor._id,
                    relatedUser: buyer._id,
                    type: 'referral',
                    amount: referralIncome,
                    description: `Referral Income (8%) from product purchase (History Restored)`,
                    status: 'completed',
                    hash: `REF_RESTORE_${product.transcation_id || Date.now()}`
                });

                // Note: We are NOT updating the user balance here to avoid double-crediting
                // if they already had the balance from migration but missing history.
                // If you want to update balance too, uncomment lines below:
                // sponsor.sponsor_income = (Number(sponsor.sponsor_income || 0)) + referralIncome;
                // sponsor.total_income = (Number(sponsor.total_income || 0)) + referralIncome;
                // await sponsor.save();

                fixedCount++;
            }
        }

        console.log(`\nAudit finished. Fixed ${fixedCount} records.`);
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

runAudit();
