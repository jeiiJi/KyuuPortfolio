-- Run once if you prefer a manual migration:
--   wrangler d1 execute <DB_NAME> --remote --file=migrations/0001_add_currency_to_commissions.sql
-- (worker.js also adds these columns automatically the first time it runs.)
ALTER TABLE commissions ADD COLUMN currency TEXT NOT NULL DEFAULT 'PHP';
ALTER TABLE commissions ADD COLUMN totalAmount REAL;
ALTER TABLE commissions ADD COLUMN exchangeRate REAL NOT NULL DEFAULT 1;
-- Existing rows were all in PHP:
UPDATE commissions SET totalAmount = totalPhp WHERE totalAmount IS NULL;