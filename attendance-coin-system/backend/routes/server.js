// backend/server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import route files
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallets');
const messRoutes = require('./routes/mess');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

// Basic root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Attendance-Coin System Backend Running' });
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
