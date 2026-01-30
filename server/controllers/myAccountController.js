const MyAccount = require('../models/MyAccount');

// @desc    Add or Update Bank Details
// @route   POST /api/my-account
// @access  Private
const addBankDetails = async (req, res) => {
    const { back_name, acc_name, branch, back_code, acc_num } = req.body;

    try {
        // Check if account already exists for user
        let account = await MyAccount.findOne({ user_id: req.user.id });

        if (account) {
            // Update existing
            account.back_name = back_name || account.back_name;
            account.acc_name = acc_name || account.acc_name;
            account.branch = branch || account.branch;
            account.back_code = back_code || account.back_code;
            account.acc_num = acc_num || account.acc_num;
            account.approve = 2; // Reset to pending on update

            await account.save();
            res.json(account);
        } else {
            // Create new
            account = await MyAccount.create({
                user_id: req.user.id,
                back_name,
                acc_name,
                branch,
                back_code,
                acc_num,
                approve: 2 // Pending
            });
            res.status(201).json(account);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get My Bank Details
// @route   GET /api/my-account
// @access  Private
const getBankDetails = async (req, res) => {
    try {
        const account = await MyAccount.findOne({ user_id: req.user.id });
        if (account) {
            res.json(account);
        } else {
            res.status(404).json({ message: 'No bank details found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Bank Requests (Admin)
// @route   GET /api/my-account/all
// @access  Private/Admin
const getAllBankRequests = async (req, res) => {
    try {
        const User = require('../models/User');

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        let query = {};

        if (search) {
            // 1. Find users matching the search term
            const matchingUsers = await User.find({
                $or: [
                    { full_name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { user_id: { $regex: search, $options: 'i' } },
                    { mobile: { $regex: search, $options: 'i' } }
                ]
            }).select('user_id id');

            // Collect all possible ID representations
            const matchingUserIds = matchingUsers.reduce((acc, user) => {
                if (user.user_id) acc.push(user.user_id);
                if (user.id) acc.push(user.id);
                // acc.push(user._id.toString()); // user_id in MyAccount is string Ref, usually user_id or id, not _id
                return acc;
            }, []);

            // 2. Build MyAccount query: match Account fields OR User IDs
            query = {
                $or: [
                    { user_id: { $in: matchingUserIds } },
                    { back_name: { $regex: search, $options: 'i' } },
                    { acc_name: { $regex: search, $options: 'i' } },
                    { acc_num: { $regex: search, $options: 'i' } },
                    { back_code: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Filter by status if provided
        if (req.query.status && req.query.status !== 'all') {
            const statusMap = { 'pending': 2, 'approved': 1, 'rejected': 0 };
            if (statusMap[req.query.status] !== undefined) {
                query.approve = statusMap[req.query.status];
            }
        }

        // 3. Get Total Count and Paginated Data
        const [total, accounts] = await Promise.all([
            MyAccount.countDocuments(query),
            MyAccount.find(query)
                .sort({ _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        // 4. Populate User Details
        const userIdsToFetch = [...new Set(accounts.map(a => a.user_id))];
        const users = await User.find({
            $or: [
                { user_id: { $in: userIdsToFetch } },
                { id: { $in: userIdsToFetch } }
            ]
        }).select('user_id id full_name email mobile').lean();

        const userMap = {};
        users.forEach(user => {
            if (user.user_id) userMap[user.user_id] = user;
            if (user.id) userMap[user.id] = user;
        });

        const populatedAccounts = accounts.map(acc => ({
            ...acc,
            user_details: userMap[acc.user_id] || { full_name: 'Unknown User', email: 'N/A' }
        }));

        res.json({
            accounts: populatedAccounts,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Bank Status (Admin)
// @route   PUT /api/my-account/:id
// @access  Private/Admin
const updateBankStatus = async (req, res) => {
    try {
        const { approve } = req.body;
        const account = await MyAccount.findById(req.params.id);

        if (account) {
            account.approve = approve;
            await account.save();
            res.json(account);
        } else {
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addBankDetails,
    getBankDetails,
    getAllBankRequests,
    updateBankStatus
};
