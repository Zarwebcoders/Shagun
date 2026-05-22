const dotenv = require('dotenv');
dotenv.config();

async function debugMaturity() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        let user = await User.findOne({ email: 'testuserone@gmail.com' });
        if (!user) {
             user = await User.findOne({ email: 'test@gmail.com' });
        }

        if (!user) {
            fs.writeFileSync('debug_results_new.md', '# User not found');
            return;
        }

        let output = `# Debug for User: ${user.email}\n`;
        output += `**Balance:** ${user.level_income}\n\n`;
        
        const levels = await LevelIncome.find({
            $or: [
                { user_id: user.id },
                { user_id: user.user_id },
                { user_id: user._id.toString() }
            ].filter(q => q.user_id)
        });

        output += `## Level Income Records (${levels.length})\n`;
        let sum = 0;
        levels.forEach((l, i) => {
            sum += l.amount;
            output += `${i+1}. From: ${l.from_user_id}, Level: ${l.level}, Amount: ${l.amount.toFixed(3)}, Date: ${l.create_at}\n`;
        });
        
        output += `\n**Total Sum of Records:** ${sum.toFixed(3)}\n`;
        
        fs.writeFileSync('debug_results_new.md', output);
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('debug_results_new.md', '# Error: ' + err.message);
    }
}

debugMaturity();
