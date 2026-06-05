const mongoose = require('mongoose');
const Notification = require('../models/Notification');

let adminNotificationsCache = null;
let adminNotificationsCacheTime = 0;
let adminCountCache = null;
let adminCountCacheTime = 0;

const userNotificationsCache = new Map(); // cacheKey -> { data, expiry }
const userCountCache = new Map(); // userId -> { count, expiry }

const clearUserNotificationCache = (userId) => {
    const userIdStr = userId.toString();
    userCountCache.delete(userIdStr);
    for (const key of userNotificationsCache.keys()) {
        if (key.startsWith(userIdStr)) {
            userNotificationsCache.delete(key);
        }
    }
};

// @desc    Get user notifications (today only, sorted by newest)
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
    try {
        if (req.user.is_admin === 1 || req.user.is_admin === "1") {
            const now = Date.now();
            if (adminNotificationsCache && (now - adminNotificationsCacheTime < 5000)) {
                return res.json(adminNotificationsCache);
            }
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            // Import all models dynamically to avoid circular dependencies
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
            const User = require('../models/User');
            const Vendor = require('../models/Vendor');

            const [
                kycs,
                withdrawals,
                bankRequests,
                payments,
                wallets,
                vendorKycs,
                vendorWithdraws,
                vendorWallets,
                vendorAccounts,
                investments
            ] = await Promise.all([
                KYC.find({ approval: { $in: [2, "2"] } }).lean(),
                Withdrawal.find({ approve: { $in: [2, "2"] } }).lean(),
                MyAccount.find({ approve: { $in: [2, "2"] } }).lean(),
                Payment.find({ approve: { $in: [2, "2"] } }).lean(),
                Wallet.find({ approve: { $in: [2, "2"] } }).lean(),
                VendorKYC.find({ approval: { $in: [2, "2"] } }).lean(),
                VendorWithdraw.find({ approve: { $in: [2, "2"] } }).lean(),
                VendorWallet.find({ approve: { $in: [2, "2"] } }).lean(),
                VendorAccount.find({ approve: { $in: [2, "2"] } }).lean(),
                Investment.find({ createdAt: { $gte: startOfToday } })
                    .populate('user', 'full_name email')
                    .populate('package', 'name')
                    .sort({ createdAt: -1 })
                    .lean()
            ]);

            // Collect all user IDs to resolve names
            const userIds = [
                ...kycs.map(k => k.user_id),
                ...withdrawals.map(w => w.user_id),
                ...bankRequests.map(b => b.user_id),
                ...payments.map(p => p.user_id),
                ...wallets.map(w => w.user_id)
            ].filter(Boolean);

            const users = await User.find({
                $or: [
                    { _id: { $in: userIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
                    { id: { $in: userIds } },
                    { user_id: { $in: userIds } }
                ]
            }).select('_id id user_id full_name email').lean();

            const userMap = {};
            users.forEach(u => {
                userMap[u._id.toString()] = u;
                if (u.id) userMap[String(u.id)] = u;
                if (u.user_id) userMap[String(u.user_id)] = u;
            });

            // Collect all vendor IDs to resolve names
            const vendorIds = [
                ...vendorKycs.map(v => v.vendor_id),
                ...vendorWithdraws.map(v => v.vendor_id),
                ...vendorWallets.map(v => v.vendor_id),
                ...vendorAccounts.map(v => v.vendor_id)
            ].filter(Boolean);

            const vendors = await Vendor.find({
                $or: [
                    { _id: { $in: vendorIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
                    { vendor_id: { $in: vendorIds } }
                ]
            }).select('_id vendor_id full_name email').lean();

            const vendorMap = {};
            vendors.forEach(v => {
                vendorMap[v._id.toString()] = v;
                if (v.vendor_id) vendorMap[String(v.vendor_id)] = v;
            });

            const adminNotifications = [];

            // 1. KYC
            kycs.forEach(k => {
                const userObj = userMap[k.user_id];
                const userName = userObj?.full_name || k.name || 'Unknown User';
                adminNotifications.push({
                    _id: k._id,
                    message: `Pending KYC: User ${userName} submitted KYC verification details.`,
                    type: 'kyc',
                    path: '/admin/kyc-approvals',
                    createdAt: k.createdAt || k.updatedAt,
                    isSynthesized: true
                });
            });

            // 2. Withdrawals
            withdrawals.forEach(w => {
                const userObj = userMap[w.user_id];
                const userName = userObj?.full_name || 'Unknown User';
                adminNotifications.push({
                    _id: w._id,
                    message: `Pending Withdrawal: User ${userName} requested ₹${w.amount}.`,
                    type: 'withdrawal',
                    path: '/admin/withdrawals',
                    createdAt: w.create_at || w.createdAt,
                    isSynthesized: true
                });
            });

            // 3. Bank Requests
            bankRequests.forEach(b => {
                const userObj = userMap[b.user_id];
                const userName = userObj?.full_name || 'Unknown User';
                adminNotifications.push({
                    _id: b._id,
                    message: `Bank verification: User ${userName} submitted bank account details.`,
                    type: 'general',
                    path: '/admin/bank-requests',
                    createdAt: b.updatedAt || b.createdAt,
                    isSynthesized: true
                });
            });

            // 4. Payments
            payments.forEach(p => {
                const userObj = userMap[p.user_id];
                const userName = userObj?.full_name || p.user_id || 'Unknown User';
                adminNotifications.push({
                    _id: p._id,
                    message: `Payment Proof: User ${userName} submitted payment of ₹${p.amount} (Tx ID: ${p.transaction_id}).`,
                    type: 'general',
                    path: '/admin/payments',
                    createdAt: p.createdAt || p.created_at,
                    isSynthesized: true
                });
            });

            // 5. Wallets
            wallets.forEach(wl => {
                const userObj = userMap[wl.user_id];
                const userName = userObj?.full_name || 'Unknown User';
                adminNotifications.push({
                    _id: wl._id,
                    message: `Wallet connection: User ${userName} submitted wallet address ${wl.wallet_add}.`,
                    type: 'general',
                    path: '/admin/manage-wallet',
                    createdAt: wl.updatedAt || wl.createdAt,
                    isSynthesized: true
                });
            });

            // 6. Vendor KYC
            vendorKycs.forEach(vk => {
                const vendorObj = vendorMap[vk.vendor_id];
                const vendorName = vendorObj?.full_name || vk.vendor_id || 'Unknown Vendor';
                adminNotifications.push({
                    _id: vk._id,
                    message: `Vendor KYC: Vendor ${vendorName} submitted KYC details.`,
                    type: 'general',
                    path: '/admin/vendor-kyc',
                    createdAt: vk.createdAt,
                    isSynthesized: true
                });
            });

            // 7. Vendor Withdrawals
            vendorWithdraws.forEach(vw => {
                const vendorObj = vendorMap[vw.vendor_id];
                const vendorName = vendorObj?.full_name || vw.vendor_id || 'Unknown Vendor';
                adminNotifications.push({
                    _id: vw._id,
                    message: `Vendor Withdrawal: Vendor ${vendorName} requested ₹${vw.amount}.`,
                    type: 'general',
                    path: '/admin/vendor-withdrawals',
                    createdAt: vw.create_at || vw.createdAt,
                    isSynthesized: true
                });
            });

            // 8. Vendor Wallets
            vendorWallets.forEach(vwl => {
                const vendorObj = vendorMap[vwl.vendor_id];
                const vendorName = vendorObj?.full_name || vwl.vendor_id || 'Unknown Vendor';
                adminNotifications.push({
                    _id: vwl._id,
                    message: `Vendor Wallet: Vendor ${vendorName} submitted wallet address.`,
                    type: 'general',
                    path: '/admin/vendor-wallets',
                    createdAt: vwl.createdAt,
                    isSynthesized: true
                });
            });

            // 9. Vendor Accounts
            vendorAccounts.forEach(va => {
                const vendorObj = vendorMap[va.vendor_id];
                const vendorName = vendorObj?.full_name || va.vendor_id || 'Unknown Vendor';
                adminNotifications.push({
                    _id: va._id,
                    message: `Vendor Account: Vendor ${vendorName} submitted bank account details.`,
                    type: 'general',
                    path: '/admin/vendor-accounts',
                    createdAt: va.createdAt,
                    isSynthesized: true
                });
            });

            // 10. Package Purchases (Investments)
            investments.forEach(inv => {
                const userName = inv.user?.full_name || 'Unknown User';
                const packageName = inv.package?.name || 'Package';
                adminNotifications.push({
                    _id: inv._id,
                    message: `Package Purchased: ${userName} bought ${packageName} for ₹${inv.amount}.`,
                    type: 'product',
                    path: '/admin/dashboard',
                    createdAt: inv.createdAt || inv.startDate,
                    isSynthesized: true
                });
            });

            // Sort all by createdAt descending
            adminNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            adminNotificationsCache = adminNotifications;
            adminNotificationsCacheTime = now;

            return res.json(adminNotifications);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const userId = req.user._id.toString();
        const cacheKey = `${userId}_p${page}_l${limit}`;
        const now = Date.now();

        if (userNotificationsCache.has(cacheKey)) {
            const cached = userNotificationsCache.get(cacheKey);
            if (now < cached.expiry) {
                return res.json(cached.data);
            }
        }

        const notifications = await Notification.find({ user_id: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        userNotificationsCache.set(cacheKey, {
            data: notifications,
            expiry: now + 5000
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get unseen notifications count (all-time unseen)
// @route   GET /api/notifications/unseen-count
// @access  Private
const getUnseenCount = async (req, res) => {
    try {
        if (req.user.is_admin === 1 || req.user.is_admin === "1") {
            const now = Date.now();
            if (adminCountCache !== null && (now - adminCountCacheTime < 5000)) {
                return res.json({ count: adminCountCache });
            }
            const KYC = require('../models/KYC');
            const Withdrawal = require('../models/Withdrawal');
            const MyAccount = require('../models/MyAccount');
            const Payment = require('../models/Payment');
            const Wallet = require('../models/Wallet');
            const VendorKYC = require('../models/VendorKYC');
            const VendorWithdraw = require('../models/VendorWithdraw');
            const VendorWallet = require('../models/VendorWallet');
            const VendorAccount = require('../models/VendorAccount');

            const [
                kycCount,
                withdrawalCount,
                bankCount,
                paymentCount,
                walletCount,
                vendorKycCount,
                vendorWithdrawCount,
                vendorWalletCount,
                vendorAccountCount
            ] = await Promise.all([
                KYC.countDocuments({ approval: 2 }),
                Withdrawal.countDocuments({ approve: 2 }),
                MyAccount.countDocuments({ approve: 2 }),
                Payment.countDocuments({ approve: 2 }),
                Wallet.countDocuments({ approve: 2 }),
                VendorKYC.countDocuments({ approval: 2 }),
                VendorWithdraw.countDocuments({ approve: 2 }),
                VendorWallet.countDocuments({ approve: 2 }),
                VendorAccount.countDocuments({ approve: 2 })
            ]);

            const count = kycCount + withdrawalCount + bankCount + paymentCount + walletCount + vendorKycCount + vendorWithdrawCount + vendorWalletCount + vendorAccountCount;
            adminCountCache = count;
            adminCountCacheTime = now;
            return res.json({ count });
        }

        const userId = req.user._id.toString();
        const now = Date.now();

        if (userCountCache.has(userId)) {
            const cached = userCountCache.get(userId);
            if (now < cached.expiry) {
                return res.json({ count: cached.count });
            }
        }

        const User = require('../models/User');
        const user = await User.findById(req.user._id).select('unreadNotificationsCount');
        const count = user ? (user.unreadNotificationsCount || 0) : 0;

        userCountCache.set(userId, {
            count,
            expiry: now + 5000
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all notifications as seen
// @route   PUT /api/notifications/mark-seen
// @access  Private
const markAllAsSeen = async (req, res) => {
    try {
        adminNotificationsCache = null;
        adminCountCache = null;
        
        await Notification.updateMany(
            { user_id: req.user._id, is_seen: false },
            { is_seen: true }
        );

        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, { unreadNotificationsCount: 0 });

        clearUserNotificationCache(req.user._id);

        res.json({ message: 'All notifications marked as seen' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        adminNotificationsCache = null;
        adminCountCache = null;

        const notification = await Notification.findOne({ _id: req.params.id, user_id: req.user._id });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        const wasUnseen = !notification.is_seen;
        notification.is_read = true;
        notification.is_seen = true;
        await notification.save();

        if (wasUnseen) {
            const User = require('../models/User');
            await User.findByIdAndUpdate(req.user._id, { $inc: { unreadNotificationsCount: -1 } });
        }

        clearUserNotificationCache(req.user._id);

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send custom notification to user(s) (Admin)
// @route   POST /api/notifications/send
// @access  Private/Admin
const sendNotification = async (req, res) => {
    const { userId, target, message, type, path } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Notification message is required' });
    }

    try {
        adminNotificationsCache = null;
        adminCountCache = null;
        const User = require('../models/User');

        if (target === 'all') {
            // Find all active users (exclude admins)
            const users = await User.find({ is_admin: { $nin: ["1", 1] }, is_deleted: { $ne: 1 } }).select('_id');
            
            const notificationDocs = users.map(user => ({
                user_id: user._id,
                message,
                type: type || 'general',
                path: path || '/'
            }));

            await Notification.insertMany(notificationDocs);
            return res.status(201).json({ message: `Notification sent to ${users.length} users` });
        }

        // Send to specific user
        let user;
        if (mongoose.isValidObjectId(userId)) {
            user = await User.findById(userId);
        }
        if (!user) {
            // Try to find by email, referral_id, user_id, id, or name (case-insensitive)
            const searchStr = userId.trim();
            user = await User.findOne({
                $or: [
                    { email: { $regex: `^${searchStr}$`, $options: 'i' } },
                    { referral_id: { $regex: `^${searchStr}$`, $options: 'i' } },
                    { user_id: { $regex: `^${searchStr}$`, $options: 'i' } },
                    { id: { $regex: `^${searchStr}$`, $options: 'i' } },
                    { full_name: { $regex: searchStr, $options: 'i' } }
                ]
            });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found. Please verify the Name, Email, or Referral ID.' });
        }

        const notification = await Notification.create({
            user_id: user._id,
            message,
            type: type || 'general',
            path: path || '/'
        });

        return res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMyNotifications,
    getUnseenCount,
    markAllAsSeen,
    markAsRead,
    sendNotification
};
