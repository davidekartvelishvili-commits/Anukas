CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_name_ka TEXT,
  category TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  commission_percent REAL DEFAULT 3.0 NOT NULL,
  qr_code TEXT UNIQUE,
  is_active INTEGER DEFAULT 0 NOT NULL,
  is_verified INTEGER DEFAULT 0 NOT NULL,
  contact_person TEXT,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  approved_at TEXT,
  approved_by TEXT
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  amount REAL NOT NULL,
  commission_amount REAL NOT NULL,
  merchant_amount REAL NOT NULL,
  coins_awarded INTEGER NOT NULL,
  status TEXT DEFAULT 'completed' NOT NULL,
  payment_reference TEXT,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  iban TEXT NOT NULL,
  bank_name TEXT,
  account_holder_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  admin_note TEXT,
  processed_by TEXT,
  processed_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

INSERT OR IGNORE INTO system_config (key, value) VALUES ('coins_per_lari', '100');
INSERT OR IGNORE INTO system_config (key, value) VALUES ('min_withdrawal', '1.0');
INSERT OR IGNORE INTO system_config (key, value) VALUES ('max_withdrawal_daily', '100.0');
INSERT OR IGNORE INTO system_config (key, value) VALUES ('withdrawal_enabled', 'true');
