const VendorKYC = require('../models/VendorKYC');

// @desc    Submit Vendor KYC
// @route   POST /api/vendor-kyc
// @access  Public/Private
const submitKYC = async (req, res) => {
    const {
        vendor_id,
        aadhar,
        pan,
        aadharcard, // Base64
        aadhar_back, // Base64
        pancard, // Base64
        agreement // Base64
    } = req.body;

    if (!vendor_id || !aadhar || !pan) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // Check if KYC already exists for this vendor
        const existingKYC = await VendorKYC.findOne({ vendor_id });
        if (existingKYC) {
            return res.status(400).json({ message: 'KYC already submitted for this Vendor ID' });
        }

        const kyc = await VendorKYC.create({
            vendor_id,
            aadhar,
            pan,
            aadharcard,
            aadhar_back,
            pancard,
            agreement,
            approval: 2 // Pending
        });

        res.status(201).json(kyc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all vendor KYC requests (Admin)
// @route   GET /api/vendor-kyc/all
// @access  Private/Admin
const getAllKYC = async (req, res) => {
    try {
        const kycs = await VendorKYC.find({}).sort({ createdAt: -1 });
        res.status(200).json(kycs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update KYC status
// @route   PUT /api/vendor-kyc/:id
// @access  Private/Admin
const updateStatus = async (req, res) => {
    const { approval } = req.body;
    try {
        const kyc = await VendorKYC.findById(req.params.id);
        if (!kyc) return res.status(404).json({ message: 'KYC not found' });

        kyc.approval = approval;
        await kyc.save();
        res.status(200).json(kyc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitKYC, getAllKYC, updateStatus };
