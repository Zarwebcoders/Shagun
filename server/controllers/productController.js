const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');
const { PRODUCT_DEFINITIONS } = require('../utils/levelIncome25');

// @desc    Purchase a product (Create Product Investment)
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
    let {
        product_id,
        quantity,
        transactionId,
        walletAddress,
        paymentSlip
    } = req.body;

    try {
        console.log("DEBUG: createProduct called with:", req.body);

        // Validate product_id (Backend IDs are numeric 1-4)
        const numericPid = Number(product_id);
        if (!product_id || !PRODUCT_DEFINITIONS[numericPid]) {
            console.warn(`Create Product Failed: Invalid product_id "${product_id}"`);
            return res.status(400).json({ message: 'Invalid product_id. Must be 1-4.' });
        }

        // Use the validated numeric ID
        product_id = numericPid;

        const productDef = PRODUCT_DEFINITIONS[product_id];
        const qty = Number(quantity) || 1;

        // Get token rate from settings (Always using rexTokenPrice for consistency)
        const tokenRateSetting = await Setting.findOne({ key: 'rexTokenPrice' });
        const tokenRate = tokenRateSetting ? Number(tokenRateSetting.value) : 7.0;

        // Calculate token amount: (token_value × quantity) ÷ token_rate
        const tokenAmount = (productDef.tokenValue * qty) / tokenRate;

        console.log(`Product: ${productDef.name}, Qty: ${qty}, Token Value: ${productDef.tokenValue}, Configured Token Rate: ₹${tokenRate}, Calculated Tokens: ${tokenAmount}`);

        // Create Product Record
        const newProduct = await Product.create({
            user_id: req.user.id || req.user._id,
            transcation_id: transactionId || `TXN${Date.now()}`,
            w2_transaction_id: "",
            packag_type: productDef.name,
            product_id: product_id,
            token_value: productDef.tokenValue,
            amount: productDef.price,
            token_amount: tokenAmount,
            wallet_address: walletAddress || "",
            approvel: 0,
            approve: 0,
            quantity: qty,
            cycle_count: 0,
            total_cycles: 24,
            next_commission_date: null,
            business_volume: productDef.price * qty,
            daily_return: 100 / 24,
            daily_return_amount: tokenAmount / 24,
            start_date: new Date(),
            end_date: null,
            cereate_at: new Date(),
            update_at: new Date(),
            paymentSlip: paymentSlip || ""
        });

        console.log("DEBUG: Product Created:", newProduct._id);

        // Create Transaction Record
        await Transaction.create({
            user: req.user._id, // Use ObjectId instead of string ID
            type: 'investment',
            amount: productDef.price * qty,
            description: `Purchase of ${qty} x ${productDef.name} (Pending Approval)`,
            status: 'pending',
            hash: transactionId || `TXN${Date.now()}`
        });

        res.status(201).json(newProduct);

    } catch (error) {
        console.error("Create Product Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        const search = req.query.search || '';

        // Build query - check all possible user ID fields to ensure visibility
        const query = {
            user_id: { $in: [req.user.id, req.user.user_id, req.user._id.toString()] }
        };

        // Add search condition if exists
        if (search) {
            query.$or = [
                { transcation_id: { $regex: search, $options: 'i' } },
                { packag_type: { $regex: search, $options: 'i' } },
                { wallet_address: { $regex: search, $options: 'i' } }
            ];
        }

        const count = await Product.countDocuments(query);

        const products = await Product.find(query)
            .select('-paymentSlip') // Exclude heavy base64 images
            .sort({ cereate_at: -1 }) // Typo in schema: cereate_at
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all products (Admin) — server-side pagination + filtering
// @route   GET /api/products/all?page=1&limit=10&search=&status=&packageType=&startDate=&endDate=
// @access  Private/Admin
const getAllProducts = async (req, res) => {
    try {
        const page       = Math.max(1, parseInt(req.query.page)  || 1);
        const limit      = Math.min(100, parseInt(req.query.limit) || 10);
        const search     = (req.query.search     || '').trim();
        const status     = req.query.status      || 'all';   // 'all' | 'approved' | 'pending' | 'rejected'
        const pkgType    = req.query.packageType || 'all';
        const startDate  = req.query.startDate   || '';
        const endDate    = req.query.endDate     || '';

        // ── 1. Build the base filter ────────────────────────────────────────
        const filter = {};

        // Status filter
        if (status === 'approved') {
            filter.approve = 1;
        } else if (status === 'pending') {
            filter.approve = 0;
        } else if (status === 'rejected') {
            filter.approve = 2;
        }

        // Package type filter
        if (pkgType && pkgType !== 'all') {
            filter.packag_type = pkgType;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.cereate_at = {};
            if (startDate) {
                const s = new Date(startDate);
                s.setHours(0, 0, 0, 0);
                filter.cereate_at.$gte = s;
            }
            if (endDate) {
                const e = new Date(endDate);
                e.setHours(23, 59, 59, 999);
                filter.cereate_at.$lte = e;
            }
        }

        // ── 2. Search: join on Users first, then filter products ─────────────
        let userIdsFromSearch = null;
        if (search) {
            // Find users whose name / referral_id match the search term
            const matchedUsers = await User.find({
                $or: [
                    { full_name:   { $regex: search, $options: 'i' } },
                    { referral_id: { $regex: search, $options: 'i' } },
                    { email:       { $regex: search, $options: 'i' } }
                ]
            }).select('_id id user_id').lean();

            const matchedUserIds = [];
            matchedUsers.forEach(u => {
                if (u.id)         matchedUserIds.push(u.id);
                if (u.user_id)    matchedUserIds.push(u.user_id);
                if (u._id)        matchedUserIds.push(u._id.toString());
            });

            // Also match product-level fields (transaction_id, wallet_address, packag_type)
            filter.$or = [
                { transcation_id:  { $regex: search, $options: 'i' } },
                { wallet_address:  { $regex: search, $options: 'i' } },
                { packag_type:     { $regex: search, $options: 'i' } },
                ...(matchedUserIds.length ? [{ user_id: { $in: matchedUserIds } }] : [])
            ];
            userIdsFromSearch = matchedUserIds;
        }

        // ── 3. Count total (for pagination metadata) ─────────────────────────
        const total = await Product.countDocuments(filter);

        // ── 4. Fetch paginated, sorted products ─────────────────────────────
        const products = await Product.find(filter)
            .select('-paymentSlip') // Exclude heavy base64 images
            .sort({ cereate_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // ── 5. Enrich with user details (only this page's products) ──────────
        const pageUserIds = [...new Set(products.map(p => p.user_id).filter(Boolean))];
        const validObjectIds = pageUserIds.filter(id => mongoose.Types.ObjectId.isValid(id));

        const users = await User.find({
            $or: [
                { id:      { $in: pageUserIds } },
                { user_id: { $in: pageUserIds } },
                { _id:     { $in: validObjectIds } }
            ]
        }).select('_id id user_id full_name email referral_id').lean();

        const userMap = {};
        users.forEach(user => {
            if (user.id)   userMap[user.id]              = user;
            if (user.user_id) userMap[user.user_id]      = user;
            if (user._id)  userMap[user._id.toString()]  = user;
        });

        const enrichedProducts = products.map(product => {
            const user = userMap[product.user_id];
            return {
                ...product,
                user: user
                    ? { name: user.full_name, email: user.email, referral_id: user.referral_id }
                    : { name: 'Unknown', email: '', referral_id: 'N/A' }
            };
        });

        // ── 6. Stats counts (computed separately so filters don't skew them) ─
        const [approvedCount, pendingCount] = await Promise.all([
            Product.countDocuments({ approve: 1 }),
            Product.countDocuments({ approve: 0 })
        ]);

        // ── 7. Distinct package types for the filter dropdown ────────────────
        const packageTypes = await Product.distinct('packag_type');

        res.json({
            products: enrichedProducts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            stats: {
                approved: approvedCount,
                pending:  pendingCount
            },
            packageTypes: packageTypes.filter(Boolean).sort()
        });
    } catch (error) {
        console.error('getAllProducts error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update product status (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProductStatus = async (req, res) => {
    try {
        const { status, onchain_tx_hash } = req.body; // 1 for Approve, 0 for Reject/Pending?
        const { distributeLevelIncome25, distributeReferralIncome } = require('../utils/levelIncome25');

        const product = await Product.findById(req.params.id);

        if (product) {
            const oldStatus = product.approve;

            // Fetch buyer upfront
            const buyer = await User.findOne({
                $or: [
                    { id: product.user_id },
                    { user_id: product.user_id },
                    { _id: mongoose.Types.ObjectId.isValid(product.user_id) ? product.user_id : null }
                ].filter(q => q._id || q.id || q.user_id)
            });

            // Update fields
            product.approve = status;
            product.update_at = Date.now();
            
            // Capture the transaction hash from the frontend (MetaMask)
            if (onchain_tx_hash) {
                product.onchain_tx_hash = onchain_tx_hash;
            }

            await product.save();

            // Create notification for the buyer
            if (buyer) {
                try {
                    await Notification.create({
                        user_id: buyer._id,
                        message: status == 1
                            ? `Your purchase of package ${product.packag_type} has been approved.`
                            : `Your purchase of package ${product.packag_type} has been rejected.`,
                        type: 'product',
                        path: '/packages'
                    });
                } catch (err) {
                    console.error("Failed to create product status notification:", err);
                }
            }

            if (status == 1) { // Approved
                console.log(`Checking/Approving product ${product._id} - Product ID: ${product.product_id}`);

                const LevelIncome = require('../models/LevelIncome');
                const ReferralIncomes = require('../models/ReferralIncomes');
                
                const hasLevelIncome = await LevelIncome.findOne({ product_id: product._id });
                const hasReferralIncome = await ReferralIncomes.findOne({ 
                    $or: [
                        { product_id: product._id },
                        { product_transcation_id: product.transcation_id }
                    ]
                });

                // 1. Fill Referral Income if missing
                if (oldStatus != 1 || !hasReferralIncome) {
                    console.log(`Distributing Referral Income for ${product._id}...`);
                    const totalProductAmount = product.amount * product.quantity;
                    await distributeReferralIncome(product.user_id, totalProductAmount, product._id, product.transcation_id);
                }

                // 2. Fill Level Income if missing
                if (oldStatus != 1 || !hasLevelIncome) {
                    console.log(`Distributing Level Income for ${product._id}...`);
                    await distributeLevelIncome25(
                        product.user_id,
                        product.token_value,
                        product.quantity,
                        product._id
                    );
                }

                // 3. Always ensure Transaction is marked completed and description is updated
                const Transaction = require('../models/Transaction');
                
                const transaction = await Transaction.findOne({ 
                    hash: product.transcation_id,
                    user: buyer ? buyer._id : product.user_id // Try specific user match to avoid hash collisions
                });

                if (transaction) {
                    transaction.status = 'completed';
                    if (transaction.description) {
                        transaction.description = transaction.description.replace(/\(Pending Approval\)/gi, '(Approved)');
                    } else {
                        transaction.description = `Purchase of ${product.name} (Approved)`;
                    }
                    await transaction.save();
                    console.log(`Transaction ${transaction._id} marked as completed for ${buyer?.email}.`);
                }
                
                console.log(`Product ${product._id} processing finished.`);
            } else if (status == 2 || status == 0) { // Rejected
                // Logic for rejection
                const transaction = await Transaction.findOne({ hash: product.transcation_id });
                if (transaction) {
                    transaction.status = 'failed';
                    await transaction.save();
                }
            }

            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Update Product Status Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getAllProducts,
    updateProductStatus
};
