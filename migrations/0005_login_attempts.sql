-- Save as: migrations/0005_login_attempts.sql
-- Run once with:  pnpm exec wrangler d1 migrations apply inkyuu-db --remote
--
-- Remembers failed admin logins per IP address, so the login can lock out password guessing
-- (5 wrong attempts => 15 minute pause). Old rows are cleaned up automatically by the worker.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT NOT NULL,
  at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts (ip, at);