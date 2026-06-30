/**
 * One-time script to build missing MongoDB indexes.
 * Run with: node server/scripts/buildIndexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function buildIndexes() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected! Building indexes...\n');

    const db = mongoose.connection.db;

    // ── Users ──────────────────────────────────────────────────────────────
    const users = db.collection('users');
    console.log('Building users indexes...');
    const userIndexes = [
        { key: { create_at: -1 } },
        { key: { sponsor_id: 1 } },
        { key: { user_id: 1 } },
        { key: { id: 1 } },
        { key: { email: 1 } },
        { key: { is_deleted: 1 } },
        { key: { is_admin: 1 } },
        { key: { full_name: 1 } },
    ];
    const existingUserIndexes = await users.listIndexes().toArray();
    const existingUserKeys = existingUserIndexes.map(i => JSON.stringify(Object.keys(i.key)));
    for (const idx of userIndexes) {
        const keyName = JSON.stringify(Object.keys(idx.key));
        if (existingUserKeys.includes(keyName)) {
            console.log(`  - Skipping (exists): ${keyName}`);
        } else {
            await users.createIndex(idx.key, { background: true });
            console.log(`  + Created: ${keyName}`);
        }
    }
    console.log('✓ users indexes done');

    // ── Products ──────────────────────────────────────────────────────────
    const products = db.collection('products');
    console.log('Building products indexes...');
    const productIndexes = [
        { key: { user_id: 1 } },
        { key: { approve: 1 } },
        { key: { cereate_at: -1 } },
        { key: { approve: 1, cereate_at: -1 } },
        { key: { user_id: 1, approve: 1 } },
    ];
    const existingProductIndexes = await products.listIndexes().toArray();
    const existingProductKeys = existingProductIndexes.map(i => JSON.stringify(Object.keys(i.key)));
    for (const idx of productIndexes) {
        const keyName = JSON.stringify(Object.keys(idx.key));
        if (existingProductKeys.includes(keyName)) {
            console.log(`  - Skipping (exists): ${keyName}`);
        } else {
            await products.createIndex(idx.key, { background: true });
            console.log(`  + Created: ${keyName}`);
        }
    }
    console.log('✓ products indexes done');

    // ── Wallets ───────────────────────────────────────────────────────────
    const wallets = db.collection('wallets');
    console.log('Building wallets indexes...');
    const walletIndexes = [
        { key: { user_id: 1 } },
        { key: { approve: 1 } },
    ];
    const existingWalletIndexes = await wallets.listIndexes().toArray();
    const existingWalletKeys = existingWalletIndexes.map(i => JSON.stringify(Object.keys(i.key)));
    for (const idx of walletIndexes) {
        const keyName = JSON.stringify(Object.keys(idx.key));
        if (existingWalletKeys.includes(keyName)) {
            console.log(`  - Skipping (exists): ${keyName}`);
        } else {
            await wallets.createIndex(idx.key, { background: true });
            console.log(`  + Created: ${keyName}`);
        }
    }
    console.log('✓ wallets indexes done');

    // ── Notifications ─────────────────────────────────────────────────────
    const notifications = db.collection('notifications');
    console.log('Building notifications indexes...');
    const notifIndexes = [
        { key: { user_id: 1 } },
        { key: { createdAt: -1 } },
    ];
    const existingNotifIndexes = await notifications.listIndexes().toArray();
    const existingNotifKeys = existingNotifIndexes.map(i => JSON.stringify(Object.keys(i.key)));
    for (const idx of notifIndexes) {
        const keyName = JSON.stringify(Object.keys(idx.key));
        if (existingNotifKeys.includes(keyName)) {
            console.log(`  - Skipping (exists): ${keyName}`);
        } else {
            await notifications.createIndex(idx.key, { background: true });
            console.log(`  + Created: ${keyName}`);
        }
    }
    console.log('✓ notifications indexes done');

    console.log('\n✅ All indexes built successfully!');
    await mongoose.disconnect();
    process.exit(0);
}

buildIndexes().catch(err => {
    console.error('❌ Error building indexes:', err);
    process.exit(1);
});
