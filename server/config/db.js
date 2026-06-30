const mongoose = require('mongoose');

// Cached connection reference for serverless environments (Vercel)
// On warm lambdas the existing connection is reused, avoiding reconnection overhead.
let cachedConn = null;

const connectDB = async () => {
    if (cachedConn && mongoose.connection.readyState === 1) {
        return cachedConn;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            autoIndex: false,               // Never rebuild indexes on boot
            maxPoolSize: 10,                // Reuse up to 10 connections per Lambda
            minPoolSize: 1,                 // Always keep 1 connection warm
            serverSelectionTimeoutMS: 3000, // Fail fast in 3s if Atlas unreachable
            socketTimeoutMS: 30000,         // Drop idle sockets after 30s
            connectTimeoutMS: 3000,         // Max 3s to establish a connection
        });

        cachedConn = conn;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
