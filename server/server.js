// Force public DNS resolvers to prevent querySrv ECONNREFUSED on local networks/ISPs
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// CORS
const allowedOrigins = [
    'http://localhost:5000',
    'https://shagunbackend.vercel.app',
    'https://shagun-black.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://www.shagunpro.com',
    'https://shagunpro.com'
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || 
                          origin.startsWith('http://localhost:') || 
                          origin.startsWith('http://127.0.0.1:') || 
                          origin.endsWith('.shagunpro.com') ||
                          origin.endsWith('.vercel.app') ||
                          origin.endsWith('.ngrok-free.dev') ||
                          origin.endsWith('.ngrok.io') ||
                          origin.endsWith('.lhr.life') ||
                          origin.endsWith('.loca.lt') ||
                          origin.endsWith('.tunnelmole.net');
                          
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    optionsSuccessStatus: 204
}


const app = express();

// ─── Disable ETag globally ────────────────────────────────────────────────────
// Express enables ETag by default. This causes the server to:
//   1. Run ALL database queries to build the full response body
//   2. Compute a SHA hash of the response
//   3. Compare it against the client's If-None-Match header
//   4. Send a 304 with no body — but AFTER spending 4-5s doing the above!
// Disabling ETag removes this useless round-trip overhead entirely.
app.set('etag', false);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "blob:", "https:"],
        },
    },
}));
app.use(morgan('dev'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Shagun API is running...');
});

// ─── Client-Side Cache-Control for API routes ─────────────────────────────────
// Instructs the browser to cache GET responses privately for 10 seconds.
// During those 10 seconds the browser uses its local copy — no network request,
// no Vercel cold-start, no DB queries. After 10s the browser fetches fresh data.
// 'private' ensures CDNs / shared caches do NOT store user-specific responses.
app.use('/api', (req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', 'private, max-age=60');
    } else {
        // Mutations must never be cached
        res.set('Cache-Control', 'no-store');
    }
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/investments', require('./routes/investmentRoutes'));
app.use('/api/token', require('./routes/tokenRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/withdrawals', require('./routes/withdrawalRoutes'));
app.use('/api/vendor-withdraw', require('./routes/vendorWithdrawRoutes'));
app.use('/api/vendor-wallet', require('./routes/vendorWalletRoutes'));
app.use('/api/vendor-kyc', require('./routes/vendorKYCRoutes'));
app.use('/api/vendor-account', require('./routes/vendorAccountRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/token-rate', require('./routes/tokenRateRoutes'));
app.use('/api/sponsor-income', require('./routes/sponsorIncomeRoutes'));
app.use('/api/shopping-token', require('./routes/shoppingTokenRoutes'));
app.use('/api/referral-incomes', require('./routes/referralIncomesRoutes'));
app.use('/api/income', require('./routes/incomeRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/my-account', require('./routes/myAccountRoutes'));
app.use('/api/mining-bonus', require('./routes/miningBonusRoutes'));
app.use('/api/migrations', require('./routes/migrationRoutes'));
app.use('/api/level-income', require('./routes/levelIncomeRoutes'));
app.use('/api/contract-queue', require('./routes/contractUpdateQueueRoutes'));
app.use('/api/commissions', require('./routes/commissionRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/monthly-tokens', require('./routes/monthlyTokenRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
