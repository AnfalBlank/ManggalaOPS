CREATE TABLE IF NOT EXISTS `opening_balances` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `cash_on_hand` real DEFAULT 0,
  `bank_mandiri` real DEFAULT 0,
  `bank_bca` real DEFAULT 0,
  `receivables` real DEFAULT 0,
  `fixed_assets` real DEFAULT 0,
  `liabilities` real DEFAULT 0,
  `equity` real DEFAULT 0,
  `created_at` integer,
  `updated_at` integer
);