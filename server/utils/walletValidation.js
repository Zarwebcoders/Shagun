const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Product = require('../models/Product');
const Investment = require('../models/Investment');

const normalizeWalletAddress = (address) => String(address || '').trim().toLowerCase();

const getUserIdentifiers = (user) => {
    if (!user) return { stringIds: [], objectIds: [], allStringIds: [] };

    const stringIds = [...new Set([
        user._id ? user._id.toString() : null,
        user.id ? String(user.id) : null,
        user.user_id ? String(user.user_id) : null
    ].filter(Boolean))];

    const objectIds = [];
    if (user._id && mongoose.Types.ObjectId.isValid(user._id)) {
        objectIds.push(new mongoose.Types.ObjectId(user._id));
    }
    if (user.id && mongoose.Types.ObjectId.isValid(user.id)) {
        objectIds.push(new mongoose.Types.ObjectId(user.id));
    }
    if (user.user_id && mongoose.Types.ObjectId.isValid(user.user_id)) {
        objectIds.push(new mongoose.Types.ObjectId(user.user_id));
    }

    const allStringIds = [...new Set([...stringIds, ...objectIds.map(o => o.toString())])];

    return { stringIds, objectIds, allStringIds };
};

/**
 * Checks if a wallet address is already linked/used by any other account
 * across Wallet, Product, and Investment collections.
 */
const findConflictingWalletAccount = async (walletAddress, user) => {
    const normalized = normalizeWalletAddress(walletAddress);
    if (!normalized) return null;

    const { allStringIds, objectIds } = getUserIdentifiers(user);
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexQuery = { $regex: `^${escaped}$`, $options: 'i' };

    // 1. Check Wallet collection
    const conflictingWallet = await Wallet.findOne({
        wallet_add: regexQuery,
        user_id: { $nin: allStringIds }
    });
    if (conflictingWallet) {
        return { source: 'Wallet', record: conflictingWallet };
    }

    // 2. Check Product collection
    const conflictingProduct = await Product.findOne({
        wallet_address: regexQuery,
        user_id: { $nin: allStringIds }
    });
    if (conflictingProduct) {
        return { source: 'Product', record: conflictingProduct };
    }

    // 3. Check Investment collection
    const conflictingInvestment = await Investment.findOne({
        walletAddress: regexQuery,
        user: { $nin: objectIds.length > 0 ? objectIds : allStringIds }
    });
    if (conflictingInvestment) {
        return { source: 'Investment', record: conflictingInvestment };
    }

    return null;
};

/**
 * Validates wallet address for user purchase / binding:
 * - Checks if the user already has a bound wallet:
 *     - If user provided a different wallet -> Error: Mismatch with registered wallet.
 *     - If user provided same wallet or didn't provide one -> Uses bound wallet.
 * - If user has no bound wallet yet:
 *     - Checks if the provided wallet address is in use by another user.
 *     - If in use -> Error: Already linked to another account.
 *     - If free -> Auto-binds in Wallet collection (if autoBind is true, default true).
 */
const validateAndResolveUserWallet = async (user, requestedWalletAddress, autoBind = true) => {
    const { allStringIds } = getUserIdentifiers(user);
    const normalizedInput = normalizeWalletAddress(requestedWalletAddress);

    // 1. Check existing wallet for this user
    let userWallet = await Wallet.findOne({ user_id: { $in: allStringIds } }).sort({ updatedAt: -1 });

    if (userWallet && userWallet.wallet_add) {
        const normalizedBound = normalizeWalletAddress(userWallet.wallet_add);
        if (normalizedInput && normalizedInput !== normalizedBound) {
            return {
                valid: false,
                message: `Submitted wallet address (${requestedWalletAddress}) does not match your registered wallet address (${userWallet.wallet_add}).`,
                walletAddress: userWallet.wallet_add
            };
        }
        return {
            valid: true,
            walletAddress: userWallet.wallet_add,
            userWallet
        };
    }

    // 2. If user doesn't have a bound wallet yet
    if (!normalizedInput) {
        return {
            valid: true,
            walletAddress: '',
            userWallet: null
        };
    }

    // Check if the provided address is used by another account
    const conflict = await findConflictingWalletAccount(normalizedInput, user);
    if (conflict) {
        return {
            valid: false,
            message: 'This wallet address is already linked to another account.',
            walletAddress: ''
        };
    }

    // Auto-bind wallet for the user if requested
    if (autoBind) {
        const canonicalUserId = user._id ? user._id.toString() : (user.id || user.user_id);
        userWallet = await Wallet.create({
            user_id: canonicalUserId,
            wallet_add: requestedWalletAddress.trim(),
            approve: 1
        });
    }

    return {
        valid: true,
        walletAddress: requestedWalletAddress.trim(),
        userWallet
    };
};

module.exports = {
    normalizeWalletAddress,
    getUserIdentifiers,
    findConflictingWalletAccount,
    validateAndResolveUserWallet
};
