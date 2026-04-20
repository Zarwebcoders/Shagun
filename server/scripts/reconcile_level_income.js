const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const LevelIncome = require('../models/LevelIncome');
const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
const { isUserEligible, LEVEL_PERCENTAGES } = require('../utils/levelIncome25');

async function findUserRobustly(id) {
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
}

async function reconcile() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shagun';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB for reconciliation');

        // 1. Find all approved products using RAW driver to avoid Mongoose casting issues
        // (Handling both string '1' and Number 1)
        const products = await mongoose.connection.db.collection('products').find({ 
            $or: [
                { approve: 1 },
                { approve: '1' }
            ]
        }).sort({ cereate_at: 1 }).toArray();
        
        console.log(`Found ${products.length} approved products to analyze.`);

        let totalAdded = 0;
        let usersUpdated = new Set();

        for (const p of products) {
            console.log(`\nAnalyzing Product: ${p._id} | Buyer ID: ${p.user_id}`);
            
            const buyer = await findUserRobustly(p.user_id);
            if (!buyer) {
                console.warn(`  Buyer not found for product ${p._id}`);
                continue;
            }

            const buyerObjectId = buyer._id;
            const originalBuyerId = buyer.id || buyer.user_id || buyer._id.toString();
            const tokenValue = p.token_value || 10000;
            const totalBaseTokens = tokenValue * p.quantity;
            
            // Assume default token rate of 7.0 for historical if not easily accessible
            const tokenRate = 7.0; 

            // Iterate 25 levels of sponsors
            let currentSponsorId = buyer.sponsor_id;
            for (let level = 1; level <= 25; level++) {
                if (!currentSponsorId) break;

                const uplineUser = await findUserRobustly(currentSponsorId);
                if (!uplineUser) break;

                const uplineStrId = uplineUser.id || uplineUser.user_id || uplineUser._id.toString();

                // Check eligibility (NOW FIXED with 'tokons' typo fix)
                const eligible = await isUserEligible(uplineUser._id);
                
                if (eligible) {
                    // Check if LevelIncome already exists for this Level + Product + Earner
                    const existingIncome = await LevelIncome.findOne({
                        user_id: uplineStrId,
                        product_id: p._id,
                        level: level
                    });

                    if (!existingIncome) {
                        console.log(`  [MISSING] Level ${level}: ${uplineUser.email} (Eligible but no income)`);
                        
                        // Calculate income
                        const installmentPercentage = LEVEL_PERCENTAGES[level - 1]; // LEVEL_PERCENTAGES is 0-indexed for Level 1
                        const installmentTokens = (totalBaseTokens * installmentPercentage) / (100 * tokenRate); 
                        const totalAnnualTokens = installmentTokens * 24;

                        // 1. Update balances
                        uplineUser.level_income = (Number(uplineUser.level_income || 0)) + totalAnnualTokens;
                        uplineUser.total_income = (Number(uplineUser.total_income || 0)) + totalAnnualTokens;
                        await uplineUser.save();

                        // 2. Create LevelIncome record
                        await LevelIncome.create({
                            user_id: uplineStrId,
                            from_user_id: originalBuyerId,
                            level: level,
                            amount: totalAnnualTokens,
                            product_id: p._id,
                            create_at: p.cereate_at || new Date()
                        });

                        // 3. Create 24 distribution records
                        const baseScheduleDate = p.cereate_at || new Date();
                        for (let inst = 1; inst <= 24; inst++) {
                            const scheduledDate = new Date(baseScheduleDate);
                            scheduledDate.setDate(scheduledDate.getDate() + ((inst - 1) * 15));

                            await MonthlyTokenDistribution.create({
                                user_id: uplineUser._id,
                                from_purchase_id: p._id,
                                from_user_id: buyerObjectId,
                                level: level,
                                monthly_amount: installmentTokens,
                                month_number: inst,
                                status: 'pending',
                                scheduled_date: scheduledDate
                            });
                        }

                        totalAdded++;
                        usersUpdated.add(uplineUser.email);
                        console.log(`  --> FIXED: Credited ${totalAnnualTokens} tokens to ${uplineUser.email}`);
                    }
                }

                // Move up
                currentSponsorId = uplineUser.sponsor_id;
            }
        }

        console.log(`\nReconciliation Complete!`);
        console.log(`Total new Level Income records created: ${totalAdded}`);
        console.log(`Unique users who received missing income: ${usersUpdated.size}`);
        if (usersUpdated.size > 0) {
            console.log(`Updated Users: ${Array.from(usersUpdated).join(', ')}`);
        }

    } catch (err) {
        console.error('Reconciliation Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

reconcile();
