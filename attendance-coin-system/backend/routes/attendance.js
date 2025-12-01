const express = require('express');
const { runQuery, getOne, getAll } = require('../db');
const { authenticateToken, requireAdmin } = require('./auth');

const router = express.Router();

// Mark attendance (admin only)
router.post('/mark', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { user_id, date, status } = req.body;

        if (!user_id || !date) {
            return res.status(400).json({ error: 'User ID and date are required' });
        }

        const attendanceStatus = status || 'present';

        // Check if attendance already marked for this date
        const existing = await getOne(
            'SELECT id FROM attendance WHERE user_id = ? AND date = ?',
            [user_id, date]
        );

        if (existing) {
            // Update existing attendance
            await runQuery(
                'UPDATE attendance SET status = ?, marked_by = ? WHERE id = ?',
                [attendanceStatus, req.user.id, existing.id]
            );

            res.json({ message: 'Attendance updated successfully' });
        } else {
            // Insert new attendance record
            await runQuery(
                'INSERT INTO attendance (user_id, date, status, marked_by) VALUES (?, ?, ?, ?)',
                [user_id, date, attendanceStatus, req.user.id]
            );

            res.status(201).json({ message: 'Attendance marked successfully' });
        }
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

// Bulk mark attendance (admin only)
router.post('/mark-bulk', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { date, attendances } = req.body;
        // attendances: [{ user_id: 1, status: 'present' }, ...]

        if (!date || !Array.isArray(attendances)) {
            return res.status(400).json({ error: 'Date and attendances array are required' });
        }

        let marked = 0;
        let updated = 0;

        for (const record of attendances) {
            const { user_id, status } = record;
            const attendanceStatus = status || 'present';

            const existing = await getOne(
                'SELECT id FROM attendance WHERE user_id = ? AND date = ?',
                [user_id, date]
            );

            if (existing) {
                await runQuery(
                    'UPDATE attendance SET status = ?, marked_by = ? WHERE id = ?',
                    [attendanceStatus, req.user.id, existing.id]
                );
                updated++;
            } else {
                await runQuery(
                    'INSERT INTO attendance (user_id, date, status, marked_by) VALUES (?, ?, ?, ?)',
                    [user_id, date, attendanceStatus, req.user.id]
                );
                marked++;
            }
        }

        res.json({
            message: 'Bulk attendance processed successfully',
            marked,
            updated
        });
    } catch (error) {
        console.error('Bulk mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark bulk attendance' });
    }
});

// Get my attendance records
router.get('/my-records', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date, limit = 30 } = req.query;

        let query = 'SELECT * FROM attendance WHERE user_id = ?';
        const params = [req.user.id];

        if (start_date && end_date) {
            query += ' AND date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY date DESC LIMIT ?';
        params.push(parseInt(limit));

        const records = await getAll(query, params);

        res.json({ records });
    } catch (error) {
        console.error('Fetch attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
});

// Get attendance for a specific user (admin only)
router.get('/user/:user_id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { user_id } = req.params;
        const { start_date, end_date, limit = 100 } = req.query;

        let query = 'SELECT * FROM attendance WHERE user_id = ?';
        const params = [user_id];

        if (start_date && end_date) {
            query += ' AND date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY date DESC LIMIT ?';
        params.push(parseInt(limit));

        const records = await getAll(query, params);

        res.json({ records });
    } catch (error) {
        console.error('Fetch user attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch user attendance' });
    }
});

// Get attendance statistics for current user
router.get('/my-stats', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
      FROM attendance 
      WHERE user_id = ?
    `;
        const params = [req.user.id];

        if (start_date && end_date) {
            query += ' AND date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const stats = await getOne(query, params);

        res.json({ stats });
    } catch (error) {
        console.error('Fetch attendance stats error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance statistics' });
    }
});

// Get attendance for a specific date (admin only)
router.get('/date/:date', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { date } = req.params;

        const records = await getAll(
            `SELECT a.*, u.username, u.full_name 
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.date = ?
       ORDER BY u.full_name`,
            [date]
        );

        res.json({ records });
    } catch (error) {
        console.error('Fetch date attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance for date' });
    }
});

// Delete attendance record (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await runQuery('DELETE FROM attendance WHERE id = ?', [id]);

        res.json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        console.error('Delete attendance error:', error);
        res.status(500).json({ error: 'Failed to delete attendance record' });
    }
});

// Process weekly coin credits (admin only)
router.post('/weekly-credit', authenticateToken, requireAdmin, async (req, res) => {
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

        // Get all students with their attendance count for the week
        const usersAttendance = await getAll(
            `SELECT u.id as user_id, u.username, u.full_name,
                    COUNT(a.id) as attendance_count
             FROM users u
             LEFT JOIN attendance a ON u.id = a.user_id 
               AND a.date BETWEEN ? AND ? 
               AND a.status = 'present'
             WHERE u.role = 'student'
             GROUP BY u.id`,
            [week_start_date, week_end_date]
        );

        let processed = 0;
        let skipped = 0;
        const results = [];

        for (const record of usersAttendance) {
            const coinsToCredit = record.attendance_count * coinsPerAttendance;

            // Check if already credited for this week
            const existing = await getOne(
                'SELECT id FROM weekly_credits WHERE user_id = ? AND week_start_date = ?',
                [record.user_id, week_start_date]
            );

            if (existing) {
                skipped++;
                continue;
            }

            if (coinsToCredit > 0) {
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
                    full_name: record.full_name,
                    attendance_count: record.attendance_count,
                    coins_credited: coinsToCredit,
                    new_balance: newBalance
                });
            }
        }

        res.json({
            message: 'Weekly coin credits processed successfully',
            week_start_date,
            week_end_date,
            coins_per_attendance: coinsPerAttendance,
            processed,
            skipped,
            results
        });
    } catch (error) {
        console.error('Weekly credit error:', error);
        res.status(500).json({ error: 'Failed to process weekly credits' });
    }
});

// Get weekly credit history (admin only)
router.get('/weekly-credits', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { user_id, limit = 50 } = req.query;

        let query = `
            SELECT wc.*, u.username, u.full_name
            FROM weekly_credits wc
            JOIN users u ON wc.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (user_id) {
            query += ' AND wc.user_id = ?';
            params.push(user_id);
        }

        query += ' ORDER BY wc.week_start_date DESC LIMIT ?';
        params.push(parseInt(limit));

        const credits = await getAll(query, params);

        res.json({ credits });
    } catch (error) {
        console.error('Fetch weekly credits error:', error);
        res.status(500).json({ error: 'Failed to fetch weekly credits' });
    }
});

// Get my weekly credit history
router.get('/my-weekly-credits', authenticateToken, async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const credits = await getAll(
            `SELECT * FROM weekly_credits 
             WHERE user_id = ? 
             ORDER BY week_start_date DESC 
             LIMIT ?`,
            [req.user.id, parseInt(limit)]
        );

        res.json({ credits });
    } catch (error) {
        console.error('Fetch my weekly credits error:', error);
        res.status(500).json({ error: 'Failed to fetch weekly credits' });
    }
});

module.exports = router;
