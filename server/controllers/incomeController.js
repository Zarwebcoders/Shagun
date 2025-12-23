const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Get level income commissions
// @route   GET /api/income/level-income
// @access  Private
const getLevelIncome = async (req, res) => {
    try {
        // Aggregate transactions of type 'level_income' for the current user
        const incomes = await Transaction.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id),
                    $or: [
                        { type: 'level_income' },
                        { type: 'referral' }
                    ]
                }
            },
            {
                $project: {
                    amount: 1,
                    description: 1,
                    type: 1,
                    levelFromDesc: {
                        $regexFind: {
                            input: "$description",
                            regex: /Level (\d+)/i
                        }
                    }
                }
            },
            {
                $addFields: {
                    level: {
                        $cond: {
                            if: { $eq: ["$type", "referral"] },
                            then: 1,
                            else: {
                                $toInt: { $arrayElemAt: ["$levelFromDesc.captures", 0] }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$level",
                    amount: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    level: "$_id",
                    amount: 1,
                    _id: 0
                }
            },
            {
                $sort: { level: 1 }
            }
        ]);

        res.json(incomes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get direct referral income
// @route   GET /api/income/referral-income
// @access  Private
const getReferralIncome = async (req, res) => {
    try {
        const incomes = await Transaction.find({
            user: req.user.id,
            type: 'referral'
        })
            .populate('relatedUser', 'name email')
            .sort({ createdAt: -1 });

        // Map relatedUser to fromUser to match frontend expectation
        const formattedIncomes = incomes.map(inc => ({
            ...inc._doc,
            fromUser: inc.relatedUser
        }));

        res.json(formattedIncomes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLevelIncome,
    getReferralIncome
};
