const axios = require('axios');

async function checkApiOutput() {
    try {
        // We can't easily get a token here without logging in, 
        // so I'll just run the controller logic directly in a script.
        const mongoose = require('mongoose');
        const dotenv = require('dotenv');
        const path = require('path');
        dotenv.config({ path: path.join(__dirname, '../.env') });
        
        await mongoose.connect(process.env.MONGO_URI);
        
        const Product = require('../models/Product');
        const Transaction = require('../models/Transaction');
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const trendData = await Product.aggregate([
            { 
                $match: { 
                    approve: { $in: [1, "1"] },
                    cereate_at: { $gte: startDate } 
                } 
            },
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: "$cereate_at" },
                        month: { $month: "$cereate_at" },
                        year: { $year: "$cereate_at" }
                    },
                    value: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        const chartData = trendData.map(d => ({
            date: `${d._id.day}/${d._id.month}`,
            value: d.value
        }));

        const maxChartValue = Math.max(...chartData.map(d => d.value), 1000);

        console.log("--- API DATA SNAPSHOT ---");
        console.log("Chart Data:", JSON.stringify(chartData, null, 2));
        console.log("Max Chart Value:", maxChartValue);
        
        // Let's also check the regions
        const usersForRegion = await User.find({ address: { $exists: true, $ne: null, $ne: "" } }).lean();
        const regionCounts = {};
        usersForRegion.forEach(u => {
            const parts = u.address.split(',').map(p => p.trim()).filter(p => p.length > 0);
            let region = "Other";
            for (let i = parts.length - 1; i >= 0; i--) {
                const part = parts[i];
                if (!/^\d+$/.test(part.replace(/\s/g, ''))) {
                    region = part;
                    break;
                }
            }
            regionCounts[region] = (regionCounts[region] || 0) + 1;
        });
        console.log("Regions Analysis:", regionCounts);
        
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

checkApiOutput();
