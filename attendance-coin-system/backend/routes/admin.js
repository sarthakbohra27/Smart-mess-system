const express = require('express');
const { runQuery, getOne, getAll, db } = require('../db');
const { authenticateToken, requireAdmin } = require('./auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
    try {
        const { role, limit = 100 } = req.query;

        let query = `
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.created_at,
             w.coin_balance, w.mess_balance
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE 1=1
    `;
        const params = [];

        if (role) {
            query += ' AND u.role = ?';
            params.push(role);
        }

        if (req.query.search) {
            query += ' AND (u.username LIKE ? OR u.full_name LIKE ?)';
            const searchTerm = `%${req.query.search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY u.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const users = await getAll(query, params);

        res.json({ users });
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user details
router.get('/users/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;

        const user = await getOne(
            `SELECT u.*, w.coin_balance, w.mess_balance, w.created_at as wallet_created_at
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.id = ?`,
            [user_id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get attendance stats
        const attendanceStats = await getOne(
            `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days
       FROM attendance 
       WHERE user_id = ?`,
            [user_id]
        );

        res.json({
            user,
            attendance_stats: attendanceStats
        });
    } catch (error) {
        console.error('Fetch user details error:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// Credit coins to user (weekly or manual)
router.post('/credit-coins', async (req, res) => {
    try {
        const { user_id, amount, description } = req.body;

        if (!user_id || !amount || amount <= 0) {
            return res.status(400).json({ error: 'User ID and valid amount are required' });
        }

        // Get current coin balance
        const wallet = await getOne(
            'SELECT coin_balance FROM wallets WHERE user_id = ?',
            [user_id]
        );

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const newBalance = wallet.coin_balance + parseInt(amount);

        // Update coin balance
        await runQuery(
            'UPDATE wallets SET coin_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [newBalance, user_id]
        );

        // Record transaction
        await runQuery(
            `INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after)
       VALUES (?, ?, 'credit', ?, ?)`,
            [user_id, amount, description || 'Manual credit by admin', newBalance]
        );

        res.json({
            message: 'Coins credited successfully',
            new_balance: newBalance
        });
    } catch (error) {
        console.error('Credit coins error:', error);
        res.status(500).json({ error: 'Failed to credit coins' });
    }
});

// Process weekly coin credits
router.post('/weekly-credit', async (req, res) => {
    try {
        const { week_start_date, week_end_date } = req.body;

        if (!week_start_date || !week_end_date) {
            return res.status(400).json({ error: 'Week start and end dates are required' });
        }

        // Get coins per attendance setting
        const setting = await getOne(
            'SELECT setting_value FROM system_settings WHERE setting_key = ?',
            ['coins_per_attendance']
        );
        const coinsPerAttendance = parseInt(setting?.setting_value || 10);

        // Get all users with their attendance count for the week
        const usersAttendance = await getAll(
            `SELECT u.id as user_id, u.username, COUNT(a.id) as attendance_count
       FROM users u
       LEFT JOIN attendance a ON u.id = a.user_id 
         AND a.date BETWEEN ? AND ? 
         AND a.status = 'present'
       WHERE u.role = 'student'
       GROUP BY u.id`,
            [week_start_date, week_end_date]
        );

        let processed = 0;
        const results = [];

        for (const record of usersAttendance) {
            const coinsToCredit = record.attendance_count * coinsPerAttendance;

            if (coinsToCredit > 0) {
                // Check if already credited for this week
                const existing = await getOne(
                    'SELECT id FROM weekly_credits WHERE user_id = ? AND week_start_date = ?',
                    [record.user_id, week_start_date]
                );

                if (!existing) {
                    // Get current balance
                    const wallet = await getOne(
                        'SELECT coin_balance FROM wallets WHERE user_id = ?',
                        [record.user_id]
                    );

                    const newBalance = wallet.coin_balance + coinsToCredit;

                    // Update wallet
                    await runQuery(
                        'UPDATE wallets SET coin_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                        [newBalance, record.user_id]
                    );

                    // Record coin transaction
                    await runQuery(
                        `INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after)
             VALUES (?, ?, 'weekly_credit', ?, ?)`,
                        [record.user_id, coinsToCredit, `Weekly credit for ${week_start_date} to ${week_end_date}`, newBalance]
                    );

                    // Record weekly credit
                    await runQuery(
                        `INSERT INTO weekly_credits (user_id, week_start_date, week_end_date, coins_credited, attendance_count)
             VALUES (?, ?, ?, ?, ?)`,
                        [record.user_id, week_start_date, week_end_date, coinsToCredit, record.attendance_count]
                    );

                    processed++;
                    results.push({
                        user_id: record.user_id,
                        username: record.username,
                        attendance_count: record.attendance_count,
                        coins_credited: coinsToCredit
                    });
                }
            }
        }

        res.json({
            message: 'Weekly coin credits processed successfully',
            processed,
            results
        });
    } catch (error) {
        console.error('Weekly credit error:', error);
        res.status(500).json({ error: 'Failed to process weekly credits' });
    }
});

// Get system statistics
router.get('/stats', async (req, res) => {
    try {
        // Total users
        const totalUsers = await getOne('SELECT COUNT(*) as count FROM users WHERE role = "student"');

        // Total coins in circulation
        const totalCoins = await getOne('SELECT SUM(coin_balance) as total FROM wallets');

        // Total mess balance
        const totalMessBalance = await getOne('SELECT SUM(mess_balance) as total FROM wallets');

        // Today's attendance
        const todayAttendance = await getOne(
            `SELECT COUNT(*) as count FROM attendance WHERE date = DATE('now') AND status = 'present'`
        );

        // Pending redemptions
        const pendingRedemptions = await getOne(
            `SELECT COUNT(*) as count FROM redemptions WHERE status = 'pending'`
        );

        // Recent activity (last 7 days)
        const recentPayments = await getOne(
            `SELECT COUNT(*) as count, SUM(amount) as total 
       FROM mess_payments 
       WHERE payment_date >= DATE('now', '-7 days')`
        );

        res.json({
            stats: {
                total_students: totalUsers.count,
                total_coins_in_circulation: totalCoins.total || 0,
                total_mess_balance: totalMessBalance.total || 0,
                today_attendance_count: todayAttendance.count,
                pending_redemptions: pendingRedemptions.count,
                recent_payments_count: recentPayments.count || 0,
                recent_payments_amount: recentPayments.total || 0
            }
        });
    } catch (error) {
        console.error('Fetch stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get/Update system settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await getAll('SELECT * FROM system_settings');
        res.json({ settings });
    } catch (error) {
        console.error('Fetch settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (!value) {
            return res.status(400).json({ error: 'Setting value is required' });
        }

        await runQuery(
            'UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
            [value, key]
        );

        res.json({ message: 'Setting updated successfully' });
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});

// Generate reports
router.get('/reports/attendance', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }

        const report = await getAll(
            `SELECT u.id, u.username, u.full_name,
              COUNT(a.id) as total_days,
              SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
              SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
              SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days
       FROM users u
       LEFT JOIN attendance a ON u.id = a.user_id AND a.date BETWEEN ? AND ?
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY u.full_name`,
            [start_date, end_date]
        );

        res.json({ report });
    } catch (error) {
        console.error('Generate attendance report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

router.get('/reports/financial', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }

        const report = await getAll(
            `SELECT u.id, u.username, u.full_name,
              w.coin_balance, w.mess_balance,
              COALESCE(SUM(mp.amount), 0) as total_payments,
              COALESCE(SUM(mp.coins_used), 0) as total_coins_used
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       LEFT JOIN mess_payments mp ON u.id = mp.user_id 
         AND DATE(mp.payment_date) BETWEEN ? AND ?
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY u.full_name`,
            [start_date, end_date]
        );

        res.json({ report });
    } catch (error) {
        console.error('Generate financial report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;
