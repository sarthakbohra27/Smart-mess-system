const express = require('express');
const { runQuery, getOne, getAll, db } = require('../db');
const { authenticateToken, requireAdmin } = require('./auth');

const router = express.Router();

// Make mess payment
router.post('/payment', authenticateToken, async (req, res) => {
    try {
        const { amount, payment_method, coins_to_use, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        if (!payment_method || !['coins', 'cash', 'online'].includes(payment_method)) {
            return res.status(400).json({ error: 'Valid payment method is required' });
        }

        // Get current wallet balances
        const wallet = await getOne(
            'SELECT coin_balance, mess_balance FROM wallets WHERE user_id = ?',
            [req.user.id]
        );

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        let coinsUsed = 0;
        let cashAmount = parseFloat(amount);

        // If paying with coins
        if (payment_method === 'coins') {
            const coinsToUse = coins_to_use || 0;

            if (coinsToUse > wallet.coin_balance) {
                return res.status(400).json({ error: 'Insufficient coin balance' });
            }

            // Get coin to rupee conversion rate
            const setting = await getOne(
                'SELECT setting_value FROM system_settings WHERE setting_key = ?',
                ['coin_to_rupee_rate']
            );
            const coinRate = parseFloat(setting?.setting_value || 1);

            const coinValue = coinsToUse * coinRate;

            if (coinValue < cashAmount) {
                return res.status(400).json({ error: 'Insufficient coins for this payment' });
            }

            coinsUsed = coinsToUse;
        }

        // Start transaction
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Record mess payment
                db.run(
                    `INSERT INTO mess_payments (user_id, amount, payment_method, coins_used, status, description)
           VALUES (?, ?, ?, ?, 'completed', ?)`,
                    [req.user.id, amount, payment_method, coinsUsed, description || ''],
                    function (err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return reject(err);
                        }

                        const paymentId = this.lastID;

                        // If coins were used, deduct from coin balance
                        if (coinsUsed > 0) {
                            const newCoinBalance = wallet.coin_balance - coinsUsed;

                            db.run(
                                'UPDATE wallets SET coin_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                                [newCoinBalance, req.user.id],
                                (err) => {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        return reject(err);
                                    }

                                    // Record coin transaction
                                    db.run(
                                        `INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after)
                     VALUES (?, ?, 'mess_payment', ?, ?)`,
                                        [req.user.id, -coinsUsed, `Mess payment #${paymentId}`, newCoinBalance],
                                        (err) => {
                                            if (err) {
                                                db.run('ROLLBACK');
                                                return reject(err);
                                            }

                                            db.run('COMMIT', (err) => {
                                                if (err) {
                                                    db.run('ROLLBACK');
                                                    return reject(err);
                                                }
                                                resolve({ paymentId, newCoinBalance });
                                            });
                                        }
                                    );
                                }
                            );
                        } else {
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return reject(err);
                                }
                                resolve({ paymentId });
                            });
                        }
                    }
                );
            });
        });

        res.status(201).json({
            message: 'Payment processed successfully',
            coins_used: coinsUsed
        });
    } catch (error) {
        console.error('Mess payment error:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
});

// Pay for meal (deduct from mess balance)
router.post('/pay', authenticateToken, async (req, res) => {
    try {
        const { amount, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        // Get current mess balance
        const wallet = await getOne(
            'SELECT mess_balance FROM wallets WHERE user_id = ?',
            [req.user.id]
        );

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const currentBalance = parseFloat(wallet.mess_balance);
        const debitAmount = parseFloat(amount);

        if (currentBalance < debitAmount) {
            return res.status(400).json({ error: 'Insufficient mess balance' });
        }

        const newBalance = currentBalance - debitAmount;

        // Start transaction
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Update wallet balance
                db.run(
                    'UPDATE wallets SET mess_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                    [newBalance, req.user.id],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return reject(err);
                        }

                        // Record mess transaction
                        db.run(
                            `INSERT INTO mess_transactions (user_id, amount, transaction_type, description, balance_after)
                             VALUES (?, ?, 'debit', ?, ?)`,
                            [req.user.id, -debitAmount, description || 'Meal payment', newBalance],
                            (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return reject(err);
                                }

                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        return reject(err);
                                    }
                                    resolve();
                                });
                            }
                        );
                    }
                );
            });
        });

        res.json({
            message: 'Meal payment successful',
            amount: debitAmount,
            new_balance: newBalance
        });
    } catch (error) {
        console.error('Meal payment error:', error);
        res.status(500).json({ error: 'Failed to process meal payment' });
    }
});

// Get my mess payment history
router.get('/my-payments', authenticateToken, async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const payments = await getAll(
            `SELECT * FROM mess_payments 
       WHERE user_id = ? 
       ORDER BY payment_date DESC 
       LIMIT ?`,
            [req.user.id, parseInt(limit)]
        );

        res.json({ payments });
    } catch (error) {
        console.error('Fetch payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

// Get all mess payments (admin only)
router.get('/payments', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { user_id, start_date, end_date, limit = 100 } = req.query;

        let query = `
      SELECT mp.*, u.username, u.full_name 
      FROM mess_payments mp
      JOIN users u ON mp.user_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (user_id) {
            query += ' AND mp.user_id = ?';
            params.push(user_id);
        }

        if (start_date && end_date) {
            query += ' AND DATE(mp.payment_date) BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY mp.payment_date DESC LIMIT ?';
        params.push(parseInt(limit));

        const payments = await getAll(query, params);

        res.json({ payments });
    } catch (error) {
        console.error('Fetch all payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Add mess balance (admin only)
router.post('/add-balance', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { user_id, amount, description } = req.body;

        if (!user_id || !amount || amount <= 0) {
            return res.status(400).json({ error: 'User ID and valid amount are required' });
        }

        // Get current mess balance
        const wallet = await getOne(
            'SELECT mess_balance FROM wallets WHERE user_id = ?',
            [user_id]
        );

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const newBalance = parseFloat(wallet.mess_balance) + parseFloat(amount);

        // Update mess balance
        await runQuery(
            'UPDATE wallets SET mess_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [newBalance, user_id]
        );

        // Record transaction
        await runQuery(
            `INSERT INTO mess_transactions (user_id, amount, transaction_type, description, balance_after)
       VALUES (?, ?, 'credit', ?, ?)`,
            [user_id, amount, description || 'Balance added by admin', newBalance]
        );

        res.json({
            message: 'Mess balance added successfully',
            new_balance: newBalance
        });
    } catch (error) {
        console.error('Add mess balance error:', error);
        res.status(500).json({ error: 'Failed to add mess balance' });
    }
});

// Get mess transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const transactions = await getAll(
            `SELECT * FROM mess_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
            [req.user.id, parseInt(limit)]
        );

        res.json({ transactions });
    } catch (error) {
        console.error('Fetch mess transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get mess payment statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        SUM(coins_used) as total_coins_used,
        AVG(amount) as average_payment
      FROM mess_payments
      WHERE status = 'completed'
    `;
        const params = [];

        if (start_date && end_date) {
            query += ' AND DATE(payment_date) BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const stats = await getOne(query, params);

        res.json({ stats });
    } catch (error) {
        console.error('Fetch mess stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
