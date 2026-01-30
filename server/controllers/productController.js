const Product = require('../models/Product');
const User = require('../models/User');
const Package = require('../models/Package');
const Transaction = require('../models/Transaction');
const { distributeLevelIncome } = require('../utils/commission');

// @desc    Purchase a product (Create Product Investment)
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
    let {
        amount,
        transactionId,
        walletAddress,
        quantity,
        packag_type // Frontend should send package type name or ID
    } = req.body;

    try {
        console.log("DEBUG: createProduct called with:", req.body);
        // 1. Find Package Details to calculate Business Volume, ROI, etc.
        // We match based on amount or packag_type if provided
        let pkg = await Package.findOne({
            status: 'active',
            minInvestment: { $lte: Number(amount) },
            $or: [
                { maxInvestment: { $gte: Number(amount) } },
                { maxInvestment: 0 }
            ]
        });
        console.log("DEBUG: Package found details:", pkg ? pkg.name : "None");

        // Default logic if no package found
        let businessVolume = Number(amount); // Default 100% BV
        let dailyReturn = 0;
        let duration = 365;
        let tokenAmount = 0; // Logic for token amount? 

        if (pkg) {
            businessVolume = (Number(amount) * (pkg.businessVolume || 100)) / 100;
            dailyReturn = pkg.dailyReturn || 0;
            duration = parseInt(pkg.duration) || 365;
            // Assuming token calculation logic exists or is fixed
            tokenAmount = (Number(amount) * 0.1); // Example: 10% token logic? Or passed from frontend?
        }

        // If frontend passes token amount or other specific logic, use it.
        // For now, we will save what we have.

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration);

        const qty = Number(quantity) || 1;
        const totalAmount = Number(amount) * qty;

        // 2. Create Product Record
        console.log("DEBUG: Creating Product...");
        const newProduct = await Product.create({
            user_id: req.user.id || req.user._id,
            transcation_id: transactionId || `TXN${Date.now()}`,
            w2_transaction_id: "",
            packag_type: pkg ? pkg.name : (packag_type || "Standard"),
            amount: Number(amount),
            token_amount: tokenAmount * qty,
            wallet_address: walletAddress || "",
            approvel: 0,
            approve: 0,
            quantity: qty,
            cycle_count: 0,
            total_cycles: 24,
            next_commission_date: null,

            business_volume: businessVolume * qty,
            daily_return: dailyReturn,
            daily_return_amount: (Number(amount) * dailyReturn) / 100,
            start_date: startDate,
            end_date: endDate,

            cereate_at: new Date(),
            update_at: new Date()
        });
        console.log("DEBUG: Product Created:", newProduct._id);

        // 3. Create Transaction Record
        await Transaction.create({
            user: req.user.id,
            type: 'investment',
            amount: totalAmount,
            description: `Purchase of ${qty} x ${newProduct.packag_type} (Pending)`,
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
        // JSON uses 'approve' and 'approvel'.
        // Let's assume input 'status' maps to 'approve' field = 1 (active/approved).

        const product = await Product.findById(req.params.id);

        if (product) {
            const oldStatus = product.approve;

            // Update fields
            product.approve = status;
            // product.approvel = status; // Maybe logic differs? JSON has approvel=0 approve=0, or approvel=0 approve=1. 
            // We will set 'approve' as the main active status.

            product.update_at = Date.now();
            await product.save();

            if (oldStatus != 1 && status == 1) { // Just Approved
                // Commission Distribution Logic
                await distributeLevelIncome(product.user_id, product.business_volume, product.transcation_id);

                // Update Transaction
                const transaction = await Transaction.findOne({ hash: product.transcation_id });
                if (transaction) {
                    transaction.status = 'completed';
                    transaction.description = transaction.description.replace('(Pending)', '(Approved)');
                    await transaction.save();
                }
            } else if (status == 2) { // Rejected? Or 0?
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
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getAllProducts,
    updateProductStatus
};
