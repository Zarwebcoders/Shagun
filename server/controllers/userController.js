const mongoose = require('mongoose');
const User = require('../models/User');
const Investment = require('../models/Investment');
const MiningBonus = require('../models/MiningBonus');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Product = require('../models/Product');

const dashboardCache = new Map(); // userId -> { data, expiry }
const DASHBOARD_CACHE_TTL = 30000; // 30 seconds cache (aligned with browser Cache-Control)

const STATS_CACHE_TTL = 300000; // 5 minutes cache for global stats
let globalStatsCache = { data: null, expiry: 0 };

const clearDashboardCache = (userId) => {
    if (userId) {
        dashboardCache.delete(userId.toString());
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    console.time('getUsers-Total');
    try {
        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;

        let keyword = {};
        if (req.query.search) {
            const searchRegex = { $regex: req.query.search, $options: 'i' };

            // Find wallet user IDs matching search term
            const matchingWallets = await Wallet.find({
                wallet_add: searchRegex
            }).select('user_id');
            const walletUserIds = matchingWallets.map(w => w.user_id).filter(Boolean);

            // Find product user IDs matching amount or business_volume if numeric
            let productUserIds = [];
            const numSearch = Number(req.query.search);
            if (!isNaN(numSearch) && req.query.search.trim() !== '') {
                const matchingProductsAmt = await Product.find({
                    $or: [
                        { amount: numSearch },
                        { business_volume: numSearch }
                    ],
                    $or: [{ approve: 1 }, { approve: '1' }]
                }).select('user_id').lean();
                productUserIds = matchingProductsAmt.map(p => p.user_id).filter(Boolean);
            }

            const allMatchingIds = [...walletUserIds, ...productUserIds];

            keyword = {
                $or: [
                    { full_name: searchRegex },
                    { email: searchRegex },
                    { referral_id: searchRegex },
                    { user_id: searchRegex },
                    { id: searchRegex },
                    { _id: { $in: allMatchingIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
                    { id: { $in: allMatchingIds } },
                    { user_id: { $in: allMatchingIds } }
                ]
            };

            // If query matches ObjectId, check _id exactly as well
            if (mongoose.Types.ObjectId.isValid(req.query.search)) {
                keyword.$or.push({ _id: new mongoose.Types.ObjectId(req.query.search) });
            }
        }

        // Amount filter
        if (req.query.amount) {
            const amtVal = Number(req.query.amount);
            if (!isNaN(amtVal)) {
                const matchingProductsAmtFilter = await Product.find({
                    $or: [
                        { amount: amtVal },
                        { business_volume: amtVal }
                    ],
                    $or: [{ approve: 1 }, { approve: '1' }]
                }).select('user_id').lean();

                const matchingUserIdsAmt = matchingProductsAmtFilter.map(p => p.user_id).filter(Boolean);
                const objectIdUserIdsAmt = matchingUserIdsAmt
                    .filter(id => mongoose.Types.ObjectId.isValid(id))
                    .map(id => new mongoose.Types.ObjectId(id));

                const amtQuery = {
                    $or: [
                        { _id: { $in: objectIdUserIdsAmt } },
                        { id: { $in: matchingUserIdsAmt } },
                        { user_id: { $in: matchingUserIdsAmt } }
                    ]
                };

                if (keyword.$or) {
                    const originalOr = keyword.$or;
                    delete keyword.$or;
                    keyword.$and = [
                        { $or: originalOr },
                        amtQuery
                    ];
                } else if (keyword.$and) {
                    keyword.$and.push(amtQuery);
                } else {
                    keyword = { ...keyword, ...amtQuery };
                }
            }
        }

        // Datewise filter (by user's create_at)
        if (req.query.startDate || req.query.endDate) {
            keyword.create_at = {};
            if (req.query.startDate) {
                const start = new Date(req.query.startDate);
                start.setHours(0, 0, 0, 0);
                keyword.create_at.$gte = start;
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                keyword.create_at.$lte = end;
            }
        }

        // Packagewise filter
        if (req.query.package && req.query.package !== 'all') {
            const matchingProducts = await Product.find({
                packag_type: req.query.package,
                $or: [{ approve: 1 }, { approve: '1' }]
            }).select('user_id').lean();
            
            const matchingUserIds = matchingProducts.map(p => p.user_id).filter(Boolean);
            
            const objectIdUserIds = matchingUserIds
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
            
            const packageQuery = {
                $or: [
                    { _id: { $in: objectIdUserIds } },
                    { id: { $in: matchingUserIds } },
                    { user_id: { $in: matchingUserIds } }
                ]
            };
            
            if (keyword.$or) {
                const originalOr = keyword.$or;
                delete keyword.$or;
                keyword.$and = [
                    { $or: originalOr },
                    packageQuery
                ];
            } else if (keyword.$and) {
                keyword.$and.push(packageQuery);
            } else {
                keyword = { ...keyword, ...packageQuery };
            }
        }

        // Quantity filter
        if (req.query.quantity) {
            const qtyVal = Number(req.query.quantity);
            if (!isNaN(qtyVal)) {
                const matchingProductsQty = await Product.find({
                    quantity: qtyVal,
                    $or: [{ approve: 1 }, { approve: '1' }]
                }).select('user_id').lean();

                const matchingUserIdsQty = matchingProductsQty.map(p => p.user_id).filter(Boolean);
                const objectIdUserIdsQty = matchingUserIdsQty
                    .filter(id => mongoose.Types.ObjectId.isValid(id))
                    .map(id => new mongoose.Types.ObjectId(id));

                const qtyQuery = {
                    $or: [
                        { _id: { $in: objectIdUserIdsQty } },
                        { id: { $in: matchingUserIdsQty } },
                        { user_id: { $in: matchingUserIdsQty } }
                    ]
                };

                if (keyword.$or) {
                    const originalOr = keyword.$or;
                    delete keyword.$or;
                    keyword.$and = [
                        { $or: originalOr },
                        qtyQuery
                    ];
                } else if (keyword.$and) {
                    keyword.$and.push(qtyQuery);
                } else {
                    keyword = { ...keyword, ...qtyQuery };
                }
            }
        }

        let count;
        console.time('getUsers-CountQuery');
        if (Object.keys(keyword).length === 0) {
            count = await User.estimatedDocumentCount();
        } else {
            count = await User.countDocuments(keyword);
        }
        console.timeEnd('getUsers-CountQuery');

        let totalStatsUsers = 0, activeStatsUsers = 0, totalStatsAdmins = 0;
        
        console.time('getUsers-StatsCache');
        if (globalStatsCache.data && Date.now() < globalStatsCache.expiry) {
            ({ totalStatsUsers, activeStatsUsers, totalStatsAdmins } = globalStatsCache.data);
        } else {
            [totalStatsUsers, activeStatsUsers, totalStatsAdmins] = await Promise.all([
                User.estimatedDocumentCount(),
                User.countDocuments({ is_deleted: 0 }),
                User.countDocuments({ is_admin: 1 })
            ]);
            globalStatsCache.data = { totalStatsUsers, activeStatsUsers, totalStatsAdmins };
            globalStatsCache.expiry = Date.now() + STATS_CACHE_TTL;
        }
        console.timeEnd('getUsers-StatsCache');

        console.time('getUsers-UsersQuery');
        const users = await User.find({ ...keyword })
            .select('-password -plain_password -address') // Exclude sensitive and unnecessary fields
            .sort({ create_at: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .lean();
        console.timeEnd('getUsers-UsersQuery');

        console.time('getUsers-DataMapping');
        // Attach wallet addresses and approved packages to each user in one batch query
        const userIds = users.map(u => u._id.toString());

        console.time('getUsers-WalletQuery');
        const wallets = await Wallet.find({ user_id: { $in: userIds } }).select('user_id wallet_add').lean();
        console.timeEnd('getUsers-WalletQuery');

        const walletMap = {};
        wallets.forEach(w => { walletMap[String(w.user_id)] = w.wallet_add; });

        // Fetch all possible user IDs formats to match with products
        const allUserIds = [];
        users.forEach(u => {
            if (u._id) allUserIds.push(u._id.toString());
            if (u.id) allUserIds.push(String(u.id));
            if (u.user_id) allUserIds.push(String(u.user_id));
        });

        console.time('getUsers-ProductQuery');
        const approvedProducts = await Product.find({
            user_id: { $in: allUserIds },
            approve: { $in: [1, '1'] }
        }).select('user_id packag_type quantity amount business_volume approve').lean();
        console.timeEnd('getUsers-ProductQuery');

        const userApprovedProductsMap = {};
        const userTotalAmountMap = {};

        approvedProducts.forEach(prod => {
            const uidStr = String(prod.user_id);
            if (!userApprovedProductsMap[uidStr]) {
                userApprovedProductsMap[uidStr] = [];
                userTotalAmountMap[uidStr] = 0;
            }
            userApprovedProductsMap[uidStr].push({
                name: prod.packag_type || "Standard",
                quantity: prod.quantity || 1
            });
            const prodAmt = Number(prod.amount) || Number(prod.business_volume) || 0;
            userTotalAmountMap[uidStr] += prodAmt;
        });

        const usersWithWalletAndPackages = users.map(u => {
            const obj = { ...u };
            obj.wallet_address = walletMap[u._id.toString()] || null;

            // Combine approved packages and total amount from all possible ID formats
            const pkgQuantities = {};
            let totalAmount = 0;
            const possibleIds = [u._id.toString(), u.id, u.user_id].filter(Boolean).map(String);
            possibleIds.forEach(idVal => {
                if (userApprovedProductsMap[idVal]) {
                    userApprovedProductsMap[idVal].forEach(item => {
                        const name = item.name;
                        pkgQuantities[name] = (pkgQuantities[name] || 0) + (Number(item.quantity) || 1);
                    });
                }
                if (userTotalAmountMap[idVal]) {
                    totalAmount += userTotalAmountMap[idVal];
                }
            });
            obj.approved_packages = Object.entries(pkgQuantities).map(([name, quantity]) => ({
                name,
                quantity
            }));
            obj.total_amount = totalAmount;
            return obj;
        });
        console.timeEnd('getUsers-DataMapping');

        res.json({
            users: usersWithWalletAndPackages,
            page,
            pages: Math.ceil(count / pageSize),
            total: count,
            stats: {
                totalUsers: totalStatsUsers,
                activeUsers: activeStatsUsers,
                totalAdmins: totalStatsAdmins
            }
        });
        console.timeEnd('getUsers-Total');
    } catch (error) {
        console.error("getUsers Error:", error);
        console.timeEnd('getUsers-Total');
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (User can update self, Admin can update anyone)
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Check permissions: Admin or Self
            // is_admin: 1 is admin
            const requester = req.user;
            const isAdmin = requester.is_admin == 1;

            if (!isAdmin && requester._id.toString() !== user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            user.full_name = req.body.full_name || user.full_name;
            user.email = req.body.email || user.email;
            user.mobile = req.body.mobile || user.mobile;
            user.address = req.body.address || user.address;
            if (req.body.password) {
                user.password = req.body.password;
            }
            if (isAdmin) {
                user.is_admin = req.body.is_admin !== undefined ? req.body.is_admin : user.is_admin;
                user.is_deleted = req.body.is_deleted !== undefined ? req.body.is_deleted : user.is_deleted;
                if (req.body.sponsor_id !== undefined) {
                    user.sponsor_id = typeof req.body.sponsor_id === 'string'
                        ? req.body.sponsor_id.trim().replace(/^sgn/i, 'SGN')
                        : req.body.sponsor_id;
                }
                user.airdrop_tokons = req.body.airdrop_tokons !== undefined ? Number(req.body.airdrop_tokons) : user.airdrop_tokons;

                // Update wallet if provided
                if (req.body.wallet_address !== undefined) {
                    const walletAddress = typeof req.body.wallet_address === 'string'
                        ? req.body.wallet_address.trim()
                        : '';
                    const userWalletIds = [...new Set([
                        user._id.toString(),
                        user.id,
                        user.user_id
                    ].filter(Boolean).map(String))];

                    if (walletAddress) {
                        const escapedAddress = walletAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const conflictingWallet = await Wallet.findOne({
                            user_id: { $nin: userWalletIds },
                            wallet_add: { $regex: `^${escapedAddress}$`, $options: 'i' }
                        });

                        if (conflictingWallet) {
                            return res.status(400).json({ message: 'This wallet address is already linked to another account.' });
                        }
                    }

                    const walletRecords = await Wallet.find({ user_id: { $in: userWalletIds } });
                    if (walletRecords.length > 0) {
                        await Wallet.updateMany(
                            { user_id: { $in: userWalletIds } },
                            { $set: { wallet_add: walletAddress } }
                        );
                    } else if (walletAddress) {
                        await Wallet.create({
                            user_id: user._id.toString(),
                            wallet_add: walletAddress,
                            approve: 1 
                        });
                    }
                }
            }



            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                full_name: updatedUser.full_name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                address: updatedUser.address,
                is_admin: updatedUser.is_admin,
                is_deleted: updatedUser.is_deleted,

            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user and all associated products, income records, and transactions
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const idParam = req.params.id;
        let queryCondition = {
            $or: [
                { user_id: idParam },
                { referral_id: idParam },
                { id: idParam }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(idParam)) {
            queryCondition.$or.push({ _id: idParam });
        }

        const user = await User.findOne(queryCondition);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userIdentifiers = [
            user._id ? user._id.toString() : null,
            user.user_id,
            user.referral_id,
            user.id
        ].filter(Boolean);

        // Delete user record
        await User.deleteOne({ _id: user._id });

        // Delete products purchased by user
        const Product = require('../models/Product');
        await Product.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } },
                { referral_id: { $in: userIdentifiers } }
            ]
        });

        // Delete level income generated by or distributed to user
        const LevelIncome = require('../models/LevelIncome');
        await LevelIncome.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } },
                { referral_id: { $in: userIdentifiers } },
                { buyer_id: { $in: userIdentifiers } },
                { from_user_id: { $in: userIdentifiers } }
            ]
        });

        // Delete referral incomes generated by or distributed to user
        const ReferralIncomes = require('../models/ReferralIncomes');
        await ReferralIncomes.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } },
                { earner_user_id: { $in: userIdentifiers } },
                { buyer_id: { $in: userIdentifiers } },
                { referral_id: { $in: userIdentifiers } }
            ]
        });

        // Delete transactions
        const Transaction = require('../models/Transaction');
        await Transaction.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } },
                { referral_id: { $in: userIdentifiers } }
            ]
        });

        // Delete commissions
        const Commission = require('../models/Commission');
        if (Commission) {
            await Commission.deleteMany({
                $or: [
                    { user_id: { $in: userIdentifiers } },
                    { referral_id: { $in: userIdentifiers } },
                    { from_user_id: { $in: userIdentifiers } }
                ]
            });
        }

        // Delete wallet records
        await Wallet.deleteMany({
            $or: [
                { user_id: { $in: userIdentifiers } }
            ]
        });

        // Clear dashboard cache
        clearDashboardCache(user._id);

        res.json({
            message: `User ${user.referral_id || user.user_id || idParam} and all associated products, incomes, transactions, and wallet data deleted successfully.`
        });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user downline
// @route   GET /api/users/downline
// @access  Private
const getDownline = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const User = require('../models/User');
        const Product = require('../models/Product');

        // 1. Find the current user and get their graph using graphLookup
        const result = await User.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
            {
                $graphLookup: {
                    from: "users",
                    startWith: "$referral_id",
                    connectFromField: "referral_id",
                    connectToField: "sponsor_id",
                    as: "network",
                    maxDepth: 24, // up to 25 levels
                    depthField: "level"
                }
            },
            {
                $project: {
                    "network.password": 0,
                    "network.plain_password": 0
                }
            }
        ]);

        if (result.length === 0 || !result[0].network || result[0].network.length === 0) {
            return res.json([]);
        }

        const network = result[0].network;

        // Collect all possible ID formats for querying products
        const userMapByIds = {}; // Maps string ID -> downline user object
        const allUserIds = [];

        network.forEach(u => {
            const possibleIds = [];
            if (u._id) possibleIds.push(u._id.toString());
            if (u.id) possibleIds.push(String(u.id));
            if (u.user_id) possibleIds.push(String(u.user_id));
            
            u.totalInvestment = 0; // Initialize totalInvestment

            possibleIds.forEach(id => {
                userMapByIds[id] = u;
                allUserIds.push(id);
            });
        });

        // 2. Query products for all downline users in one single query
        const products = await Product.find({
            user_id: { $in: allUserIds },
            $or: [
                { approve: 1 },
                { approve: '1' }
            ]
        }).lean();

        // 3. Sum up the investments in memory
        products.forEach(prod => {
            const uidStr = String(prod.user_id);
            const userObj = userMapByIds[uidStr];
            if (userObj) {
                const vol = Number(prod.business_volume || 0);
                const amt = Number(prod.amount || 0);
                userObj.totalInvestment += vol > 0 ? vol : amt;
            }
        });

        // Sort by create_at descending
        network.sort((a, b) => new Date(b.create_at || 0) - new Date(a.create_at || 0));

        res.json(network);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard summary stats
// @route   GET /api/users/dashboard-summary
// @access  Private
const getDashboardSummary = async (req, res) => {
    try {
        const User = require('../models/User');
        const ReferralIncomes = require('../models/ReferralIncomes');
        const Product = require('../models/Product');

        const user = req.user;
        const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(Boolean);

        // 1. Count direct referrals (level 0) using index
        const directTeamCount = await User.countDocuments({ sponsor_id: user.referral_id });

        // 2. Sum up referral income using index
        const referralIncomes = await ReferralIncomes.aggregate([
            { $match: { earner_user_id: { $in: queryIds } } },
            { $group: { _id: null, total: { $sum: "$referral_amount" } } }
        ]);
        const calculatedSponsorIncome = referralIncomes.length > 0 ? referralIncomes[0].total : 0;

        // 3. Check if has approved product using index
        const hasApprovedProduct = await Product.exists({
            user_id: { $in: queryIds },
            $or: [
                { approve: 1 },
                { approve: '1' }
            ]
        });

        res.json({
            directTeamCount,
            calculatedSponsorIncome,
            hasApprovedProduct: !!hasApprovedProduct
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all consolidated dashboard data in one single request
// @route   GET /api/users/dashboard-data
// @access  Private
const getDashboardData = async (req, res) => {
    try {
        const User = require('../models/User');
        const ReferralIncomes = require('../models/ReferralIncomes');
        const Product = require('../models/Product');
        const MiningBonus = require('../models/MiningBonus');
        const Wallet = require('../models/Wallet');
        const MonthlyTokenDistribution = require('../models/MonthlyTokenDistribution');
        const Withdrawal = require('../models/Withdrawal');

        const user = req.user;
        const userId = user._id.toString();
        const nowTime = Date.now();

        if (dashboardCache.has(userId)) {
            const cached = dashboardCache.get(userId);
            if (nowTime < cached.expiry) {
                cached.data.user = user;
                return res.json(cached.data);
            }
        }

        const queryIds = [user.id, user.user_id, user.referral_id, user._id.toString()].filter(Boolean);

        // Fetch all data in parallel to reduce database waiting time
        const now = new Date();
        const Setting = require('../models/Setting');
        const [
            directTeamCount,
            hasApprovedProduct,
            wallet,
            history,
            maturedSummaries,
            approvedWithdrawals,
            settings
        ] = await Promise.all([
            User.countDocuments({ sponsor_id: user.referral_id }),
            Product.exists({
                user_id: { $in: queryIds },
                $or: [
                    { approve: 1 },
                    { approve: '1' }
                ]
            }),
            Wallet.findOne({ user_id: { $in: queryIds }, approve: 1 }).lean(),
            MiningBonus.find({ 
                user_id: { $in: queryIds.concat([user.referral_id]) }
            }).sort({ created_at: -1 }).limit(20).lean(),
            MonthlyTokenDistribution.aggregate([
                {
                    $match: {
                        user_id: user._id,
                        scheduled_date: { $lte: now }
                    }
                },
                {
                    $group: {
                        _id: {
                            isLevel: { $gt: ["$level", 0] }
                        },
                        totalMatured: { $sum: "$monthly_amount" }
                    }
                }
            ]),
            Withdrawal.find({
                user_id: { $in: queryIds },
                approve: "1"
            }).lean(),
            Setting.find({}).lean()
        ]);

        const calculatedSponsorIncome = user.sponsor_income || 0;
        const activeWalletAddress = wallet ? wallet.wallet_add : "N/A";
        
        const populatedHistory = history.map(record => {
            if (!record.wallet_address || record.wallet_address === "N/A") {
                record.wallet_address = activeWalletAddress;
            }
            return record;
        });

        const withdrawnLevel = approvedWithdrawals
            .filter(w => w.withdraw_type === 'level_income')
            .reduce((sum, w) => sum + w.amount, 0);
        
        const withdrawnMining = approvedWithdrawals
            .filter(w => w.withdraw_type === 'mining_bonus')
            .reduce((sum, w) => sum + w.amount, 0);

        let totalMaturedLevel = 0;
        let totalMaturedMining = 0;
        maturedSummaries.forEach(item => {
            if (item._id && item._id.isLevel) {
                totalMaturedLevel = item.totalMatured;
            } else {
                totalMaturedMining = item.totalMatured;
            }
        });

        const available = Math.max(0, totalMaturedLevel - withdrawnLevel);
        const availableROI = Math.max(0, totalMaturedMining - withdrawnMining);
        const canWithdraw = (available + availableROI) >= 100;

        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });

        const responseData = {
            user,
            summary: {
                directTeamCount,
                calculatedSponsorIncome,
                hasApprovedProduct: !!hasApprovedProduct
            },
            miningHistory: populatedHistory,
            availableWithdrawal: {
                available: Math.round(available * 100) / 100,
                availableROI: Math.round(availableROI * 100) / 100,
                canWithdraw,
                reason: !canWithdraw ? 'Insufficient matured balance (Minimum ₹100)' : null
            },
            settings: settingsObj
        };

        dashboardCache.set(userId, {
            data: responseData,
            expiry: nowTime + DASHBOARD_CACHE_TTL
        });

        // Tell the browser to cache this response privately for 10s
        // (avoids repeat requests + ETag 304 round-trips on Vercel)
        res.set('Cache-Control', 'private, max-age=10');
        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mine tokens (Daily Claim)
// @route   POST /api/users/mine
// @access  Private
const mineTokens = async (req, res) => {
    try {
        let user = await User.findById(req.user._id || req.user.id);
        
        if (!user) {
            user = await User.findOne({ user_id: req.user.user_id || req.user.id });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        
        // Check for active Products (modern package model)
        const activeProducts = await Product.find({ 
            user_id: { $in: [
                user._id.toString(),
                String(user.id),
                String(user.user_id)
            ].filter(Boolean) },
            $or: [
                { approve: 1 },
                { approve: '1' }
            ]
        });

        // Fallback or additional check for legacy Investments (if still used)
        const activeInvestments = await Investment.find({ 
            user: user._id, 
            status: { $regex: /^active$/i } 
        });

        if (activeProducts.length === 0 && activeInvestments.length === 0) {
            return res.status(403).json({ message: "No active investments found. Buy a package to start mining!" });
        }

        // Calculate total daily return based on active products and investments
        let totalReward = 0;
        
        activeProducts.forEach(prod => {
            totalReward += (prod.daily_return_amount || 0);
        });

        activeInvestments.forEach(inv => {
            const dailyReturn = inv.dailyReturn || 0;
            totalReward += (inv.amount * dailyReturn) / 100;
        });

        // Proceed even if reward is 0 (for testing/history tracking)
        if (totalReward < 0) totalReward = 0; 

        // Update User stats
        user.last_mining_data = new Date();
        user.mining_count_thismounth = String(Number(user.mining_count_thismounth || 0) + 1);
        user.total_mining_count = (Number(user.total_mining_count || 0)) + 1;
        user.mining_bonus = (Number(user.mining_bonus || 0)) + totalReward;
        user.total_income = (Number(user.total_income || 0)) + totalReward;
        await user.save();

        // Calculate current cycle (1-24)
        const currentCycle = ((user.total_mining_count - 1) % 24) + 1;

        // Fetch User's Wallet Address (checking all possible user ID formats)
        const walletQueryIds = [
            user._id.toString(),
            user.id,
            user.user_id
        ].filter(Boolean);
        const wallet = await Wallet.findOne({ user_id: { $in: walletQueryIds }, approve: 1 });
        const walletAddress = wallet ? wallet.wallet_add : "N/A";

        // Record Mining Bonus entry with History Data
        await MiningBonus.create({
            user_id: user.id || user.user_id || user._id.toString(),
            amount: totalReward,
            wallet_address: walletAddress,
            cycle_number: currentCycle,
            created_at: new Date()
        });

        // Increment cycle count for active products
        await Product.updateMany(
            { user_id: user.id || user.user_id || user._id.toString(), approve: 1, cycle_count: { $lt: 24 } },
            { $inc: { cycle_count: 1 } }
        );

        // Record Transaction
        await Transaction.create({
            user: user._id,
            type: 'mining_bonus',
            amount: totalReward,
            description: `Mining Reward Claimed - Cycle ${currentCycle}/24`,
            status: 'completed'
        });

        clearDashboardCache(user._id);

        res.json({
            message: "Mining successful!",
            reward: totalReward,
            last_mining_data: user.last_mining_data,
            mining_count_thismounth: user.mining_count_thismounth,
            total_mining_count: user.total_mining_count,
            cycle_number: currentCycle
        });

    } catch (error) {
        console.error("Mining Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's mining history
// @route   GET /api/users/mining-history
// @access  Private
const getMiningHistory = async (req, res) => {
    try {
        // 1. Find user to get all ID formats
        const user = await User.findById(req.user._id || req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // 2. Fetch User's currently approved Wallet Address for fallback
        const walletQueryIds = [
            user._id.toString(),
            user.id,
            user.user_id
        ].filter(Boolean);
        const wallet = await Wallet.findOne({ user_id: { $in: walletQueryIds }, approve: 1 });
        const activeWalletAddress = wallet ? wallet.wallet_add : "N/A";

        // 3. Query history using all known IDs for this user
        const history = await MiningBonus.find({ 
            user_id: { $in: [
                user._id.toString(),
                user.id,
                user.user_id,
                user.referral_id
            ].filter(Boolean) }
        }).sort({ created_at: -1 });
        
        // 4. Populate wallet address dynamically if it is missing/N/A in historical entries
        const populatedHistory = history.map(record => {
            const doc = record.toObject ? record.toObject() : { ...record };
            if (!doc.wallet_address || doc.wallet_address === "N/A") {
                doc.wallet_address = activeWalletAddress;
            }
            return doc;
        });

        res.json(populatedHistory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Check sponsor name by referral ID
// @route   GET /api/users/check-sponsor/:referralId
// @access  Public
const checkSponsor = async (req, res) => {
    try {
        const referralId = req.params.referralId;
        const upperReferralId = typeof referralId === 'string' ? referralId.trim().toUpperCase() : referralId;
        
        const sponsor = await User.findOne({
            $or: [
                { referral_id: upperReferralId },
                { user_id: upperReferralId },
                { id: upperReferralId },
                { referral_id: referralId },
                { user_id: referralId },
                { id: referralId }
            ]
        }).select('full_name');

        if (sponsor) {
            res.json({ name: sponsor.full_name });
        } else {
            res.status(404).json({ message: 'Sponsor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Impersonate a user (Admin bypass login)
// @route   POST /api/users/:id/impersonate
// @access  Private/Admin
const impersonateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.json({
            _id: user.id,
            full_name: user.full_name,
            email: user.email,
            is_admin: user.is_admin,
            token: token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getDownline,
    mineTokens,
    getMiningHistory,
    checkSponsor,
    impersonateUser,
    getDashboardSummary,
    getDashboardData
};
