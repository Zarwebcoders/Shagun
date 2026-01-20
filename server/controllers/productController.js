const Product = require('../models/Product');
const User = require('../models/User');
const Package = require('../models/Package');
const Transaction = require('../models/Transaction'); // Keeping Transaction for log consistency
const { distributeLevelIncome } = require('../utils/commission'); // Assuming this exists or will be adapted

// @desc    Purchase a product (Create Product Investment)
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
    let { amount, transactionId, sponsorId, paymentSlip, product: productName, walletAddress } = req.body;

    // Map frontend camelCase to backend snake_case if necessary, or just use variables
    // Frontend sends: amount, transactionId, sponsorId, paymentSlip, product, walletAddress

    try {
        // 1. Find Package Details (for BV and ROI calculation)
        // Note: 'product' from frontend is the Name (e.g. "Milkish Herbal Animal Feed")
        // We might need to look up a Package based on amount or name? 
        // Investment controller looked up by amount.

        // Let's try to find a package that matches the amount criteria
        let pkg = await Package.findOne({
            status: 'active',
            minInvestment: { $lte: Number(amount) },
            $or: [
                { maxInvestment: { $gte: Number(amount) } },
                { maxInvestment: 0 }
            ]
        });

        // Fallback or specific product logic could go here

        let businessVolume = 0;
        let dailyReturn = 0;
        let duration = 365;

        if (pkg) {
            businessVolume = (Number(amount) * (pkg.businessVolume || 100)) / 100;
            dailyReturn = pkg.dailyReturn || 0;
            duration = parseInt(pkg.duration) || 365;
        } else {
            // Default values if no package logic found (should ideally find one)
            businessVolume = Number(amount); // 100% BV default?
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration);

        // 2. Create Product Record
        const newProduct = await Product.create({
            user_id: req.user.id || req.user._id, // User ID String
            product_name: productName || "Unknown Product",
            amount: Number(amount),
            packag_type: pkg ? pkg.name : "Standard", // Mapping package name to packag_type
            status: 2, // 2: Pending
            transcation_id: transactionId || `TXN${Date.now()}`,
            cereate_at: new Date(),
            update_at: new Date(),

            // Logic Fields
            sponsor_id: sponsorId,
            payment_slip: paymentSlip,
            business_volume: businessVolume,
            daily_return: dailyReturn,
            daily_return_amount: (Number(amount) * dailyReturn) / 100,
            start_date: startDate,
            end_date: endDate,
            wallet_address: walletAddress
        });

        // 3. Create Transaction Record (for history consistency)
        await Transaction.create({
            user: req.user.id,
            type: 'investment', // Keep 'investment' type for now or change to 'product_purchase'
            amount: Number(amount),
            description: `Purchase of ${productName} (Pending Approval)`,
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
        const products = await Product.find({ user_id: req.user.id })
            .sort({ cereate_at: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all products (Admin)
// @route   GET /api/products/all
// @access  Private/Admin
const getAllProducts = async (req, res) => {
    try {
        // Need to populate user details? 
        // Since user_id is String in schema (per strict requirement), simple populate might not work if it's not ObjectId ref.
        // If User model uses _id as ObjectId, and product.user_id stores that ObjectId string, distinct populate:
        // We might need to manually aggregate or if user_id IS the ObjectId string, mongoose might casting auto-work if schema definition allows.
        // But I defined `user_id: String`. To populate, I might need virtuals or change schema to ObjectId.
        // User schema says: `user_id: { type: String }`. Wait. User has `_id` (auto) AND `user_id` (custom string?).
        // If `req.user.id` is the `_id` (ObjectId), then I am storing ObjectId as string.
        // I will attempt simple find first.

        const products = await Product.find({}).sort({ cereate_at: -1 });
        // Ideally we fetch user names too. 
        // For now, let's just return products.
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update product status (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProductStatus = async (req, res) => {
    try {
        const { status } = req.body; // Expecting Number: 0, 1, 2
        const product = await Product.findById(req.params.id);

        if (product) {
            const oldStatus = product.status;
            product.status = status;
            product.update_at = Date.now();
            await product.save();

            // Status Logic: 2=Pending, 1=Approved, 0=Rejected

            if (oldStatus !== 1 && status === 1) { // Approved
                // Distribute Commission
                // Need to find User object. 
                // distributeLevelIncome expects userId (ObjectId usually).

                // Logic to handle commission distribution
                try {
                    // We need to pass the proper User ID to distributeLevelIncome.
                    // product.user_id is stored as String. Assuming it matches User._id
                    await distributeLevelIncome(product.user_id, product.business_volume || product.amount, product.transcation_id);

                    // Update Transaction Status
                    const transaction = await Transaction.findOne({ hash: product.transcation_id });
                    if (transaction) {
                        transaction.status = 'completed';
                        transaction.description = transaction.description.replace('(Pending Approval)', '');
                        await transaction.save();
                    }

                } catch (commError) {
                    console.error("Commission Error:", commError);
                }

            } else if (status === 0) { // Rejected
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
