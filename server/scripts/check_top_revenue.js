const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkRevenue() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const topRev = await mongoose.connection.db.collection('products').aggregate([
            { $match: { approve: { $in: [1, '1'] } } },
            { 
                $project: { 
                    user_id: 1, 
                    amount: 1, 
                    quantity: 1, 
                    packag_type: 1,
                    total: { 
                        $multiply: [
                            { $convert: { input: '$amount', to: 'double', onError: 0, onNull: 0 } },
                            { $convert: { input: '$quantity', to: 'double', onError: 1, onNull: 1 } }
                        ] 
                    } 
                } 
            },
            { $sort: { total: -1 } },
            { $limit: 10 }
        ]).toArray();

        console.log('Top Revenue Products:');
        topRev.forEach(p => {
            console.log(`User: ${p.user_id} | Pkg: ${p.packag_type} | Amt: ${p.amount} | Qty: ${p.quantity} | Total: ${p.total}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkRevenue();
