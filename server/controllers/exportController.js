const LevelIncome = require('../models/LevelIncome');
const ReferralIncomes = require('../models/ReferralIncomes');
const MiningBonus = require('../models/MiningBonus');
const User = require('../models/User');

// ─── Helper: build date range filter ─────────────────────────────────────────
function buildDateFilter(field, startDate, endDate) {
    const filter = {};
    if (startDate || endDate) {
        filter[field] = {};
        if (startDate) filter[field].$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter[field].$lte = end;
        }
    }
    return filter;
}

// ─── Helper: send CSV response ────────────────────────────────────────────────
function sendCSV(res, filename, headers, rows) {
    const csvLines = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvLines.join('\r\n'));
}

// ─── Helper: send Excel (simple XML Spreadsheet) ──────────────────────────────
function sendExcel(res, filename, headers, rows) {
    const sheetRows = [headers, ...rows].map(row =>
        '<Row>' + row.map(cell =>
            `<Cell><Data ss:Type="String">${String(cell ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Data></Cell>`
        ).join('') + '</Row>'
    ).join('\n');

    const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Sheet1">
    <Table>${sheetRows}</Table>
  </Worksheet>
</Workbook>`;

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(xml);
}

// ─── Export: Level Income ─────────────────────────────────────────────────────
// GET /api/export/level-income?format=csv|excel&startDate=&endDate=
const exportLevelIncome = async (req, res) => {
    try {
        const { format = 'csv', startDate, endDate } = req.query;
        const user = await User.findById(req.user._id).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const queryIds = [user.id, user.user_id, user._id.toString()].filter(Boolean);

        const dateFilter = buildDateFilter('created_at', startDate, endDate);
        const query = { user_id: { $in: queryIds }, level: { $gt: 0 }, ...dateFilter };

        const incomes = await LevelIncome.find(query).sort({ created_at: -1 }).lean();

        // Fetch from-user names
        const fromIds = [...new Set(incomes.map(i => i.from_user_id).filter(Boolean))];
        const fromUsers = await User.find({
            $or: [{ id: { $in: fromIds } }, { user_id: { $in: fromIds } }]
        }).select('id user_id full_name email referral_id').lean();

        const userMap = {};
        fromUsers.forEach(u => {
            if (u.id) userMap[u.id] = u;
            if (u.user_id) userMap[u.user_id] = u;
        });

        const headers = ['Level', 'From User', 'Referral ID', 'Email', 'Amount (SGN)', 'Date'];
        const rows = incomes.map(inc => {
            const fu = userMap[inc.from_user_id] || {};
            return [
                inc.level,
                fu.full_name || 'Unknown',
                fu.referral_id || '-',
                fu.email || '-',
                inc.amount,
                new Date(inc.created_at || inc.create_at).toLocaleString()
            ];
        });

        const filename = `level-income-${Date.now()}`;
        if (format === 'excel') return sendExcel(res, filename + '.xls', headers, rows);
        return sendCSV(res, filename + '.csv', headers, rows);
    } catch (error) {
        console.error('Export level income error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── Export: Referral Income ──────────────────────────────────────────────────
// GET /api/export/referral-income?format=csv|excel&startDate=&endDate=
const exportReferralIncome = async (req, res) => {
    try {
        const { format = 'csv', startDate, endDate } = req.query;
        const user = await User.findById(req.user._id).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const queryIds = [user.id, user.user_id, user._id.toString()].filter(Boolean);
        const dateFilter = buildDateFilter('create_at', startDate, endDate);

        const incomes = await ReferralIncomes.find({
            earner_user_id: { $in: queryIds },
            ...dateFilter
        }).sort({ create_at: -1 }).lean();

        // Fetch referred user details for names
        const mongoose = require('mongoose');
        const referredIds = [...new Set(incomes.map(inc => inc.referred_user_id).filter(id => id))];
        const users = await User.find({ 
            $or: [
                { id: { $in: referredIds } },
                { user_id: { $in: referredIds } },
                { referral_id: { $in: referredIds } },
                { _id: { $in: referredIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } }
            ]
        }).select('id full_name').lean();
        const userMap = {};
        users.forEach(u => {
            if (u.id) userMap[u.id] = u;
            userMap[u._id.toString()] = u;
        });

        // Fetch products to check for EV products and PV values
        const Product = require('../models/Product');
        const productIds = [...new Set(incomes.map(inc => inc.product_id).filter(id => mongoose.Types.ObjectId.isValid(id)))];
        const products = await Product.find({ _id: { $in: productIds } }).lean();
        const productMap = {};
        products.forEach(p => {
            productMap[p._id.toString()] = p;
        });

        const headers = ['Date', 'From User', 'Product ID', 'Txn Amount', 'Percentage (%)', 'Referral Amount', 'Status'];
        const rows = incomes.map(inc => {
            const referredName = userMap[inc.referred_user_id]?.full_name || 'Unknown';
            const prod = inc.product_id ? productMap[inc.product_id] : null;
            const isEV = prod && (
                (prod.packag_type && prod.packag_type.toLowerCase().includes('ev')) ||
                prod.product_id === 4
            );
            const txnAmount = isEV ? `${prod.quantity || 1} PV` : inc.amount;

            return [
                new Date(inc.create_at || inc.created_at).toLocaleString(),
                referredName,
                inc.product_id || '-',
                txnAmount,
                inc.percentage,
                inc.referral_amount,
                inc.status || '-'
            ];
        });

        const filename = `referral-income-${Date.now()}`;
        if (format === 'excel') return sendExcel(res, filename + '.xls', headers, rows);
        return sendCSV(res, filename + '.csv', headers, rows);
    } catch (error) {
        console.error('Export referral income error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── Export: Mining History ───────────────────────────────────────────────────
// GET /api/export/mining-history?format=csv|excel&startDate=&endDate=
const exportMiningHistory = async (req, res) => {
    try {
        const { format = 'csv', startDate, endDate } = req.query;
        const user = await User.findById(req.user._id).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const queryIds = [user.id, user.user_id, user._id.toString()].filter(Boolean);
        const dateFilter = buildDateFilter('created_at', startDate, endDate);

        const history = await MiningBonus.find({
            user_id: { $in: queryIds },
            ...dateFilter
        }).sort({ created_at: -1 }).lean();

        const headers = ['Cycle #', 'Amount (SGN)', 'Wallet', 'Tx Hash', 'Status', 'Date'];
        const rows = history.map(h => [
            h.cycle_number || '-',
            h.amount,
            h.wallet_address || '-',
            h.hash || '-',
            h.status || 'SUCCESS',
            new Date(h.created_at || h.create_at).toLocaleString()
        ]);

        const filename = `mining-history-${Date.now()}`;
        if (format === 'excel') return sendExcel(res, filename + '.xls', headers, rows);
        return sendCSV(res, filename + '.csv', headers, rows);
    } catch (error) {
        console.error('Export mining history error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { exportLevelIncome, exportReferralIncome, exportMiningHistory };
