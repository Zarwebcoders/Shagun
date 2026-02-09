const Product = require('../models/Product');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const { PRODUCT_DEFINITIONS } = require('../utils/levelIncome25');

// @desc    Purchase a product (Create Product Investment)
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
    let {
        product_id,
        quantity,
        transactionId,
        walletAddress
    } = req.body;

    try {
        console.log("DEBUG: createProduct called with:", req.body);

        // Validate product_id
        if (!product_id || !PRODUCT_DEFINITIONS[product_id]) {
            return res.status(400).json({ message: 'Invalid product_id. Must be 1-4.' });
        }

        const productDef = PRODUCT_DEFINITIONS[product_id];
        const qty = Number(quantity) || 1;

        // Get token rate from settings
        const tokenRateSetting = await Setting.findOne({ key: 'rexTokenPrice' });
        const tokenRate = tokenRateSetting ? Number(tokenRateSetting.value) : 1;

        // Calculate token amount: (token_value × quantity) ÷ token_rate
        const tokenAmount = (productDef.tokenValue * qty) / tokenRate;

        console.log(`Product: ${productDef.name}, Qty: ${qty}, Token Value: ${productDef.tokenValue}, Token Rate: ${tokenRate}, Tokens: ${tokenAmount}`);

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
            daily_return: 0,
            daily_return_amount: 0,
            start_date: new Date(),
            end_date: null,
            cereate_at: new Date(),
            update_at: new Date()
        });

        console.log("DEBUG: Product Created:", newProduct._id);

        // Create Transaction Record
        await Transaction.create({
            user: req.user.id,
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

        // Build query
        const query = {
            user_id: req.user.id
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

// @desc    Get all products (Admin)
// @route   GET /api/products/all
// @access  Private/Admin
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ cereate_at: -1 }).lean();

        // Enrich with User details
        const enrichedProducts = await Promise.all(products.map(async (product) => {
            const user = await User.findOne({ id: product.user_id }).select('full_name email');
            return {
                ...product,
                user: user ? {
                    name: user.full_name,
                    email: user.email
                } : { name: 'Unknown', email: '' }
            };
        }));

        res.json(enrichedProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update product status (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProductStatus = async (req, res) => {
    try {
        const { status } = req.body; // 1 for Approve, 0 for Reject/Pending?
        const { distributeLevelIncome25, distributeReferralIncome } = require('../utils/levelIncome25');

        const product = await Product.findById(req.params.id);

        if (product) {
            const oldStatus = product.approve;

            // Update fields
            product.approve = status;
            product.update_at = Date.now();
            await product.save();

            if (oldStatus != 1 && status == 1) { // Just Approved
                console.log(`Approving product ${product._id} - Product ID: ${product.product_id}, Qty: ${product.quantity}`);

                // 1. Distribute Referral Income (8% of product amount)
                const totalProductAmount = product.amount * product.quantity;
                await distributeReferralIncome(product.user_id, totalProductAmount);

                // 2. Distribute 25-Level Income (monthly payouts)
                await distributeLevelIncome25(
                    product.user_id,
                    product.token_value,
                    product.quantity,
                    product._id
                );

                // Update Transaction
                const transaction = await Transaction.findOne({ hash: product.transcation_id });
                if (transaction) {
                    transaction.status = 'completed';
                    transaction.description = transaction.description.replace('(Pending Approval)', '(Approved)');
                    await transaction.save();
                }

                console.log(`Product ${product._id} approved successfully`);
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
