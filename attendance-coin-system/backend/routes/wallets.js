const express = require('express');
const { runQuery, getOne, getAll } = require('../db');
const { authenticateToken, requireAdmin } = require('./auth');

const router = express.Router();

// Get my wallet
router.get('/my-wallet', authenticateToken, async (req, res) => {
    try {
        const wallet = await getOne(
            'SELECT * FROM wallets WHERE user_id = ?',
            [req.user.id]
        );

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        res.json({ wallet });
    } catch (error) {
        console.error('Fetch wallet error:', error);
        res.status(500).json({ error: 'Failed to fetch wallet' });
    }
});

// Get coin transaction history
router.get('/coin-transactions', authenticateToken, async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const transactions = await getAll(
            `SELECT * FROM coin_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
            [req.user.id, parseInt(limit)]
        );

        res.json({ transactions });
    } catch (error) {
        console.error('Fetch coin transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Request redemption
router.post('/redeem', authenticateToken, async (req, res) => {
    try {
        const { coins_to_redeem, redemption_type, notes } = req.body;

        if (!coins_to_redeem || coins_to_redeem <= 0) {
            return res.status(400).json({ error: 'Valid coin amount is required' });
        }

        if (!redemption_type || !['mess_credit', 'voucher', 'other'].includes(redemption_type)) {
            return res.status(400).json({ error: 'Valid redemption type is required' });
        }

        // Get minimum redemption requirement
        const setting = await getOne(
            'SELECT setting_value FROM system_settings WHERE setting_key = ?',
            ['min_redemption_coins']
        );
        const minCoins = parseInt(setting?.setting_value || 50);

        if (coins_to_redeem < minCoins) {
            return res.status(400).json({
                error: `Minimum ${minCoins} coins required for redemption`
            });
        }

        // Check wallet balance
        const wallet = await getOne(
            'SELECT coin_balance FROM wallets WHERE user_id = ?',
            [req.user.id]
        );

        if (!wallet || wallet.coin_balance < coins_to_redeem) {
            return res.status(400).json({ error: 'Insufficient coin balance' });
        }

        // Calculate amount to be credited (if mess_credit)
        let amountCredited = null;
        if (redemption_type === 'mess_credit') {
            const rateSetting = await getOne(
                'SELECT setting_value FROM system_settings WHERE setting_key = ?',
                ['coin_to_rupee_rate']
            );
            const coinRate = parseFloat(rateSetting?.setting_value || 1);
            amountCredited = coins_to_redeem * coinRate;
        }

        // Create redemption request
        const result = await runQuery(
            `INSERT INTO redemptions (user_id, coins_redeemed, redemption_type, amount_credited, status, notes)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
            [req.user.id, coins_to_redeem, redemption_type, amountCredited, notes || '']
        );

        res.status(201).json({
            message: 'Redemption request submitted successfully',
            redemption_id: result.id,
            status: 'pending'
        });
    } catch (error) {
        console.error('Redemption error:', error);
        res.status(500).json({ error: 'Failed to process redemption request' });
    }
});

// Get my redemption requests
router.get('/my-redemptions', authenticateToken, async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const redemptions = await getAll(
            `SELECT * FROM redemptions 
       WHERE user_id = ? 
       ORDER BY requested_at DESC 
       LIMIT ?`,
            [req.user.id, parseInt(limit)]
        );

        res.json({ redemptions });
    } catch (error) {
        console.error('Fetch redemptions error:', error);
        res.status(500).json({ error: 'Failed to fetch redemptions' });
    }
});

// Get all redemption requests (admin only)
router.get('/redemptions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;

        let query = `
      SELECT r.*, u.username, u.full_name 
      FROM redemptions r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        query += ' ORDER BY r.requested_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const redemptions = await getAll(query, params);

        res.json({ redemptions });
    } catch (error) {
        console.error('Fetch all redemptions error:', error);
        res.status(500).json({ error: 'Failed to fetch redemptions' });
    }
});

// Process redemption (admin only)
router.post('/redemptions/:id/process', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, notes } = req.body; // action: 'approve' or 'reject'

        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Valid action (approve/reject) is required' });
        }

        // Get redemption details
        const redemption = await getOne(
            'SELECT * FROM redemptions WHERE id = ?',
            [id]
        );

        if (!redemption) {
            return res.status(404).json({ error: 'Redemption not found' });
        }

        if (redemption.status !== 'pending') {
            return res.status(400).json({ error: 'Redemption already processed' });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        if (action === 'approve') {
            // Get current wallet
            const wallet = await getOne(
                'SELECT coin_balance, mess_balance FROM wallets WHERE user_id = ?',
                [redemption.user_id]
            );

            if (wallet.coin_balance < redemption.coins_redeemed) {
                return res.status(400).json({ error: 'User has insufficient coins' });
            }

            // Deduct coins
            const newCoinBalance = wallet.coin_balance - redemption.coins_redeemed;
            await runQuery(
                'UPDATE wallets SET coin_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                [newCoinBalance, redemption.user_id]
            );

            // Record coin transaction
            await runQuery(
                `INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after)
         VALUES (?, ?, 'redemption', ?, ?)`,
                [redemption.user_id, -redemption.coins_redeemed, `Redemption #${id}`, newCoinBalance]
            );

            // If mess_credit, add to mess balance
            if (redemption.redemption_type === 'mess_credit' && redemption.amount_credited) {
                const newMessBalance = parseFloat(wallet.mess_balance) + parseFloat(redemption.amount_credited);
                await runQuery(
                    'UPDATE wallets SET mess_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                    [newMessBalance, redemption.user_id]
                );

                // Record mess transaction
                await runQuery(
                    `INSERT INTO mess_transactions (user_id, amount, transaction_type, description, balance_after)
           VALUES (?, ?, 'credit', ?, ?)`,
                    [redemption.user_id, redemption.amount_credited, `Coin redemption #${id}`, newMessBalance]
                );
            }
        }

        // Update redemption status
        await runQuery(
            `UPDATE redemptions 
       SET status = ?, processed_at = CURRENT_TIMESTAMP, processed_by = ?, notes = ?
       WHERE id = ?`,
            [newStatus, req.user.id, notes || redemption.notes, id]
        );

        res.json({
            message: `Redemption ${action}d successfully`,
            status: newStatus
        });
    } catch (error) {
        console.error('Process redemption error:', error);
        res.status(500).json({ error: 'Failed to process redemption' });
    }
});

// Get wallet summary (admin only) - basic version
router.get('/user/:user_id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { user_id } = req.params;

        const wallet = await getOne(
            `SELECT w.*, u.username, u.full_name 
       FROM wallets w
       JOIN users u ON w.user_id = u.id
       WHERE w.user_id = ?`,
            [user_id]
        );

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        res.json({ wallet });
    } catch (error) {
        console.error('Fetch user wallet error:', error);
        res.status(500).json({ error: 'Failed to fetch wallet' });
    }
});

// Get complete wallet details with transactions (admin or own wallet)
router.get('/users/:id/wallet', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { coin_limit = 20, mess_limit = 20 } = req.query;

        // Check if user is accessing their own wallet or is admin
        if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get wallet balance
        const wallet = await getOne(
            `SELECT w.*, u.username, u.full_name, u.email, u.role
       FROM wallets w
       JOIN users u ON w.user_id = u.id
       WHERE w.user_id = ?`,
            [id]
        );

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        // Get recent coin transactions
        const coinTransactions = await getAll(
            `SELECT * FROM coin_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
            [id, parseInt(coin_limit)]
        );

        // Get recent mess transactions
        const messTransactions = await getAll(
            `SELECT * FROM mess_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
            [id, parseInt(mess_limit)]
        );

        // Get transaction summaries
        const coinSummary = await getOne(
            `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_debits
       FROM coin_transactions 
       WHERE user_id = ?`,
            [id]
        );

        const messSummary = await getOne(
            `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_debits
       FROM mess_transactions 
       WHERE user_id = ?`,
            [id]
        );

        res.json({
            wallet: {
                user_id: wallet.user_id,
                username: wallet.username,
                full_name: wallet.full_name,
                email: wallet.email,
                role: wallet.role,
                coin_balance: wallet.coin_balance,
                mess_balance: parseFloat(wallet.mess_balance),
                created_at: wallet.created_at,
                updated_at: wallet.updated_at
            },
            coin_transactions: {
                recent: coinTransactions,
                summary: {
                    total_transactions: coinSummary.total_transactions || 0,
                    total_credits: coinSummary.total_credits || 0,
                    total_debits: coinSummary.total_debits || 0
                }
            },
            mess_transactions: {
                recent: messTransactions,
                summary: {
                    total_transactions: messSummary.total_transactions || 0,
                    total_credits: parseFloat(messSummary.total_credits || 0),
                    total_debits: parseFloat(messSummary.total_debits || 0)
                }
            }
        });
    } catch (error) {
        console.error('Fetch wallet with transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch wallet details' });
    }
});

module.exports = router;
