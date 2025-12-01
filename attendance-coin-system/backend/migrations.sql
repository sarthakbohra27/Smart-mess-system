-- Attendance Coin Mess System Database Schema
-- SQLite Database

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK(role IN ('student', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Wallets Table (separate coin_balance and mess_balance)
CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    coin_balance INTEGER DEFAULT 0 CHECK(coin_balance >= 0),
    mess_balance DECIMAL(10, 2) DEFAULT 0.00 CHECK(mess_balance >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'present' CHECK(status IN ('present', 'absent', 'late')),
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    marked_by INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id),
    UNIQUE(user_id, date)
);

-- Coin Transactions Table
CREATE TABLE IF NOT EXISTS coin_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(30) CHECK(transaction_type IN ('credit', 'debit', 'weekly_credit', 'redemption', 'mess_payment')),
    description TEXT,
    balance_after INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mess Balance Transactions Table
CREATE TABLE IF NOT EXISTS mess_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(30) CHECK(transaction_type IN ('credit', 'debit', 'payment', 'refund')),
    description TEXT,
    balance_after DECIMAL(10, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mess Payments Table
CREATE TABLE IF NOT EXISTS mess_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) CHECK(payment_method IN ('coins', 'cash', 'online')),
    coins_used INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Redemptions Table (for redeeming coins)
CREATE TABLE IF NOT EXISTS redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coins_redeemed INTEGER NOT NULL CHECK(coins_redeemed > 0),
    redemption_type VARCHAR(30) CHECK(redemption_type IN ('mess_credit', 'voucher', 'other')),
    amount_credited DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    processed_by INTEGER,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Weekly Coin Credits Table (tracking weekly coin distribution)
CREATE TABLE IF NOT EXISTS weekly_credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    coins_credited INTEGER NOT NULL,
    attendance_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, week_start_date)
);

-- System Settings Table (for configurable parameters)
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mess_transactions_user ON mess_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mess_payments_user ON mess_payments(user_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_weekly_credits_user ON weekly_credits(user_id, week_start_date);

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
    ('coins_per_attendance', '10', 'Number of coins credited per attendance'),
    ('weekly_credit_day', 'Sunday', 'Day of the week when coins are credited'),
    ('coin_to_rupee_rate', '1', 'Conversion rate: 1 coin = X rupees'),
    ('min_redemption_coins', '50', 'Minimum coins required for redemption'),
    ('mess_payment_enabled', 'true', 'Enable/disable mess payments with coins');

-- Insert default admin user (password: admin123 - bcrypt hash)
-- Note: In production, change this password immediately
INSERT OR IGNORE INTO users (username, email, password_hash, full_name, role) VALUES
    ('admin', 'admin@example.com', '$2b$10$rKvVPZhJZqGdQxKJxKxKxOxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'System Administrator', 'admin');
