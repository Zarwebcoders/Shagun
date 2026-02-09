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
const corsOptions = {
    origin: [
        'http://localhost:5000',
        'https://shagunbackend.vercel.app',
        'https://shagun-black.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true,
    optionSuccessStatus: 200
}

const app = express();

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Shagun API is running...');
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
app.use('/api/monthly-tokens', require('./routes/monthlyTokenRoutes'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
