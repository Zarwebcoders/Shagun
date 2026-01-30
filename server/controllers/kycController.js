const KYC = require('../models/KYC');
const User = require('../models/User');

// @desc    Submit KYC
// @route   POST /api/kyc
// @access  Private
const submitKYC = async (req, res) => {
    // Expecting flat structure or mapped from frontend
    // Frontend sends: aadharNumber, panNumber, documents: { aadharFront, aadharBack, panCard, agreement }
    const {
        aadharNumber,
        panNumber,
        documents
    } = req.body;

    try {
        const kycExists = await KYC.findOne({ user_id: req.user.id });

        if (kycExists) {
            return res.status(400).json({ message: 'KYC already submitted' });
        }

        const kyc = await KYC.create({
            user_id: req.user.id,
            aadhar: aadharNumber,
            pan: panNumber,
            aadharcard: documents.aadharFront, // Mapping to schema field
            aadhar_back: documents.aadharBack, // Mapping to schema field
            pancard: documents.panCard,       // Mapping to schema field
            agreement: documents.agreement,    // Mapping to schema field
            approval: 2 // Pending
        });

        // Update user status
        await User.findByIdAndUpdate(req.user.id, { kycStatus: 'pending' });

        res.status(201).json(kyc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all pending KYC (Admin)
// @route   GET /api/kyc/pending
// @access  Private/Admin
const getPendingKYC = async (req, res) => {
    try {
        // approval: 2 is Pending
        const kycs = await KYC.find({ approval: 2 }).populate('user_id', 'name email');
        res.json(kycs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user KYC
// @route   GET /api/kyc/me
// @access  Private
const getMyKYC = async (req, res) => {
    try {
        const kyc = await KYC.findOne({ user_id: req.user.id });
        if (!kyc) {
            return res.status(404).json({ message: 'KYC not found' });
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

        // Provide User details manually via id lookup
        const enrichedHistory = await Promise.all(historyDocs.map(async (doc) => {
            // Find user where User.id matches KYC.user_id (legacy string ID)
            const user = await User.findOne({ id: doc.user_id }).select('full_name email');
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
