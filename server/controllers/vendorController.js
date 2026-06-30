const Vendor = require('../models/Vendor');
const bcrypt = require('bcryptjs');

// @desc    Register a new vendor
// @route   POST /api/vendors
// @access  Public
const createVendor = async (req, res) => {
    const { vendor_id, full_name, email, password } = req.body;

    if (!vendor_id || !full_name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const vendorExists = await Vendor.findOne({ $or: [{ vendor_id }, { email }] });
        if (vendorExists) {
            return res.status(400).json({ message: 'Vendor ID or Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const vendor = await Vendor.create({
            vendor_id,
            full_name,
            email,
            password: hashedPassword,
            acceptance_percentage: 0,
            settlement_cycle: 0
        });

        res.status(201).json({
            _id: vendor._id,
            vendor_id: vendor.vendor_id,
            full_name: vendor.full_name,
            email: vendor.email,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all vendors (Admin)
// @route   GET /api/vendors/all
// @access  Private/Admin
const getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find({}).sort({ create_at: -1 });
        res.status(200).json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update vendor details (Admin)
// @route   PUT /api/vendors/:id
// @access  Private/Admin
const updateVendor = async (req, res) => {
    const { acceptance_percentage, settlement_cycle } = req.body;

    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        if (acceptance_percentage !== undefined) vendor.acceptance_percentage = acceptance_percentage;
        if (settlement_cycle !== undefined) vendor.settlement_cycle = settlement_cycle;

        await vendor.save();
        res.status(200).json(vendor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Current Vendor Profile
// @route   GET /api/vendors/me
// @access  Private (Needs middleware if we implement vendor login, using vendor_id query/param for now or auth middleware if User model is linked. Assuming independent for structure alignment first)
// NOTE: Since we are using User model for auth mostly, I will allow fetching by vendor_id parameter for the frontend 'me' call simulation or implement login if requested. 
// For now, I'll add a 'getVendorByVendorId' for the frontend to use.
const getVendorByVendorId = async (req, res) => {
    const { vendor_id } = req.params;
    try {
        const vendor = await Vendor.findOne({ vendor_id });
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
        res.status(200).json(vendor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { createVendor, getVendors, updateVendor, getVendorByVendorId };
