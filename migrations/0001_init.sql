-- migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS commissions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  social TEXT,
  type TEXT NOT NULL,
  finish TEXT,
  characters INTEGER,
  background TEXT,
  commercial BOOLEAN,
  priority BOOLEAN,
  dueDate TEXT,
  notes TEXT,
  "references" TEXT, -- Store JSON stringified array of images
  totalPhp INTEGER,
  submittedAt TEXT,
  stage INTEGER,
  discountCode TEXT,
  discountName TEXT,
  discountAmount INTEGER,
  historyType TEXT,
  submittedToHistoryAt TEXT
);

CREATE TABLE IF NOT EXISTS gallery (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  category TEXT,
  scope TEXT,
  service TEXT,
  colorFinish TEXT,
  publishedAt TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  category TEXT,
  price REAL,
  publishedAt TEXT
);

CREATE TABLE IF NOT EXISTS discounts (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  percentage INTEGER,
  requirementType TEXT,
  description TEXT,
  startDate TEXT,
  endDate TEXT,
  bannerImage TEXT,
  code TEXT
);