-- Site-wide settings controlled from the admin sidebar.
-- Semi-Realistic is hidden unless semiRealisticVisible = '1'.
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('semiRealisticVisible', '0');