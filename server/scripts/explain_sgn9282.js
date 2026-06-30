const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const LevelIncome = require('../models/LevelIncome');
const Product = require('../models/Product');

async function explain() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const user_ids = ['SGN282', '282', 'SGN9282'];
        const incomes = await LevelIncome.find({ user_id: { $in: user_ids } });
        
        console.log(`Total Income Records for SGN9282: ${incomes.length}`);
        
        const stats = {};
        for (const inc of incomes) {
            const level = `Level ${inc.level}`;
            if (!stats[level]) stats[level] = { count: 0, total: 0 };
            stats[level].count++;
            stats[level].total += inc.amount;
        }

        console.log("\n--- LEVEL BREAKDOWN ---");
        console.table(Object.keys(stats).sort().map(lvl => ({
            Level: lvl,
            'Total Products': stats[lvl].count,
            'Income (SGN)': stats[lvl].total.toFixed(2)
        })));

        const total = incomes.reduce((acc, curr) => acc + curr.amount, 0);
        console.log(`\nGRAND TOTAL INCOME: ${total.toFixed(2)} SGN`);

        // Explain a sample calculation (Level 1)
        console.log("\n--- CALCULATION FORMULA ---");
        console.log("For each product in your team:");
        console.log("1. Base Tokens = (Product Token Value * Quantity) / Token Rate (7.0)");
        console.log("2. Level % = e.g., Level 1 is 3.6%, Level 2 is 1.8%, etc.");
        console.log("3. Total SGN = (Base Tokens * Level %) * 24 Months");
        
        console.log("\nExample (standard product):");
        console.log("  (10000 / 7) * 0.036 * 24 = 1,234.28 SGN per product");

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

explain();
