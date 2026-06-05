const mongoose = require('mongoose');
const KYC = require('../models/KYC');
const User = require('../models/User');
const MyAccount = require('../models/MyAccount');
const Notification = require('../models/Notification');

// @desc    Submit KYC
// @route   POST /api/kyc
// @access  Private
const submitKYC = async (req, res) => {
    // Expecting flat structure or mapped from frontend
    // Frontend sends: aadharNumber, panNumber, documents: { aadharFront, aadharBack, panCard, agreement, profilePhoto, chequePassbook }, bankDetails: { ... }
    const {
        aadharNumber,
        panNumber,
        documents,
        bankDetails
    } = req.body;

    try {
        const kycExists = await KYC.findOne({ user_id: req.user._id });

        if (kycExists) {
            // Check approval status: if not rejected, block it
            if (kycExists.approval !== 0) {
                return res.status(400).json({ message: 'KYC already submitted and is pending or approved' });
            }

            // Update existing rejected KYC record
            kycExists.aadhar = aadharNumber;
            kycExists.pan = panNumber;
            kycExists.aadharcard = documents.aadharFront;
            kycExists.aadhar_back = documents.aadharBack;
            kycExists.pancard = documents.panCard;
            kycExists.agreement = documents.agreement;
            kycExists.profile_photo = documents.profilePhoto;
            kycExists.cheque_passbook = documents.chequePassbook || "";
            
            if (bankDetails) {
                kycExists.bank_name = bankDetails.bankName;
                kycExists.acc_name = bankDetails.accountName;
                kycExists.branch = bankDetails.branch;
                kycExists.ifsc_code = bankDetails.ifscCode;
                kycExists.acc_num = bankDetails.accountNumber;
            }

            kycExists.approval = 2; // Set back to pending review
            await kycExists.save();

            // Update user status back to pending
            await User.findByIdAndUpdate(req.user._id, { kycStatus: 'pending' });

            // SYNC WITH MYACCOUNT
            if (bankDetails) {
                const myAccData = {
                    user_id: req.user.id || req.user.user_id || req.user._id.toString(),
                    back_name: bankDetails.bankName,
                    acc_name: bankDetails.accountName,
                    branch: bankDetails.branch,
                    back_code: bankDetails.ifscCode,
                    acc_num: bankDetails.accountNumber,
                    approve: 2 // Pending
                };

                await MyAccount.findOneAndUpdate(
                    { user_id: myAccData.user_id },
                    myAccData,
                    { upsert: true, new: true }
                );
            }

            return res.status(200).json(kycExists);
        }

        const kyc = await KYC.create({
            user_id: req.user._id,
            aadhar: aadharNumber,
            pan: panNumber,
            aadharcard: documents.aadharFront, // Mapping to schema field
            aadhar_back: documents.aadharBack, // Mapping to schema field
            pancard: documents.panCard,       // Mapping to schema field
            agreement: documents.agreement,    // Mapping to schema field
            profile_photo: documents.profilePhoto, // Mapping to schema field
            cheque_passbook: documents.chequePassbook || "", // Mapping to schema field
            bank_name: bankDetails?.bankName,
            acc_name: bankDetails?.accountName,
            branch: bankDetails?.branch,
            ifsc_code: bankDetails?.ifscCode,
            acc_num: bankDetails?.accountNumber,
            approval: 2 // Pending
        });

        // Update user status - using _id for reliable lookup
        await User.findByIdAndUpdate(req.user._id, { kycStatus: 'pending' });

        // SYNC WITH MYACCOUNT
        if (bankDetails) {
            const myAccData = {
                user_id: req.user.id || req.user.user_id || req.user._id.toString(),
                back_name: bankDetails.bankName,
                acc_name: bankDetails.accountName,
                branch: bankDetails.branch,
                back_code: bankDetails.ifscCode,
                acc_num: bankDetails.accountNumber,
                approve: 2 // Pending
            };

            await MyAccount.findOneAndUpdate(
                { user_id: myAccData.user_id },
                myAccData,
                { upsert: true, new: true }
            );
        }

        res.status(201).json(kyc);
    } catch (error) {
        console.error("Submit KYC Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all pending KYC (Admin)
// @route   GET /api/kyc/pending
// @access  Private/Admin
const getPendingKYC = async (req, res) => {
    try {
        // approval: 2 is Pending
        const kycs = await KYC.find({ approval: 2 }).populate('user_id', 'full_name email');
        const enrichedKycs = kycs.map(doc => {
            const user = doc.user_id;
            return {
                ...doc._doc,
                user_id: user ? {
                    name: user.full_name,
                    email: user.email
                } : null
            };
        });
        res.json(enrichedKycs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user KYC
// @route   GET /api/kyc/me
// @access  Private
const getMyKYC = async (req, res) => {
    try {
        const kyc = await KYC.findOne({ user_id: req.user._id });
        if (!kyc) {
            return res.status(200).json(null);
        }
        res.json(kyc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update KYC status (Admin)
// @route   PUT /api/kyc/:id
// @access  Private/Admin
const updateKYCStatus = async (req, res) => {
    const { status } = req.body; // Expecting 'approved' or 'rejected' string from frontend, need to map to int

    try {
        const kyc = await KYC.findById(req.params.id);

        if (kyc) {
            let approvalStatus = 2;
            let userStatus = 'pending';

            if (status === 'approved') {
                approvalStatus = 1;
                userStatus = 'verified';
            } else if (status === 'rejected') {
                approvalStatus = 0;
                userStatus = 'rejected';
            }

            kyc.approval = approvalStatus;
            await kyc.save();

            // Update user KYC status
            await User.findByIdAndUpdate(kyc.user_id, { kycStatus: userStatus });

            // Create notification for user
            try {
                await Notification.create({
                    user_id: kyc.user_id,
                    message: status === 'approved' 
                        ? 'Your KYC verification request has been approved.' 
                        : 'Your KYC verification request has been rejected.',
                    type: 'kyc',
                    path: '/kyc'
                });
            } catch (err) {
                console.error("Failed to create KYC notification:", err);
            }

            res.json(kyc);
        } else {
            res.status(404).json({ message: 'KYC request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get KYC stats (Admin)
// @route   GET /api/kyc/stats
// @access  Private/Admin
const getKYCStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [pendingReview, approvedToday, rejectedToday, totalVerified] = await Promise.all([
            KYC.countDocuments({ approval: 2 }),
            KYC.countDocuments({ approval: 1, updatedAt: { $gte: today } }),
            KYC.countDocuments({ approval: 0, updatedAt: { $gte: today } }),
            KYC.countDocuments({ approval: 1 })
        ]);

        res.json({
            pendingReview,
            approvedToday,
            rejectedToday,
            totalVerified
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get KYC history (Approved/Rejected)
// @route   GET /api/kyc/history
// @access  Private/Admin
const getKYCHistory = async (req, res) => {
    try {
        // Fetch history records
        const historyDocs = await KYC.find({ approval: { $ne: 2 } })
            .sort({ updatedAt: -1 })
            .lean();

        // Provide User details manually via id lookup (supporting both legacy string ID and MongoDB _id)
        const enrichedHistory = await Promise.all(historyDocs.map(async (doc) => {
            // Try searching by legacy numeric 'id' first, then by MongoDB '_id' if no user found
            let user = await User.findOne({ id: doc.user_id }).select('full_name email');
            
            if (!user && mongoose.isValidObjectId(doc.user_id)) {
                user = await User.findById(doc.user_id).select('full_name email');
            }

            return {
                ...doc,
                user_id: user ? {
                    name: user.full_name, // Map full_name to name for frontend display
                    email: user.email
                } : null
            };
        }));

        res.json(enrichedHistory);
    } catch (error) {
        console.error("KYC History Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitKYC,
    getPendingKYC,
    getMyKYC,
    updateKYCStatus,
    getKYCStats,
    getKYCHistory,
};
