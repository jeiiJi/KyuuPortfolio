-- Save as: migrations/0002_media_fields.sql
-- Run once with:  pnpm exec wrangler d1 migrations apply inkyuu-db --remote
-- (SQLite has no "ADD COLUMN IF NOT EXISTS", so this file must only run once. Wrangler tracks that for you.)

-- gallery already has scope, service, colorFinish
ALTER TABLE gallery ADD COLUMN artStyle TEXT;
ALTER TABLE gallery ADD COLUMN dateMade TEXT;
ALTER TABLE gallery ADD COLUMN tools TEXT;
ALTER TABLE gallery ADD COLUMN format TEXT;

ALTER TABLE products ADD COLUMN artStyle TEXT;
ALTER TABLE products ADD COLUMN scope TEXT;
ALTER TABLE products ADD COLUMN service TEXT;
ALTER TABLE products ADD COLUMN colorFinish TEXT;
ALTER TABLE products ADD COLUMN dateMade TEXT;
ALTER TABLE products ADD COLUMN tools TEXT;
ALTER TABLE products ADD COLUMN format TEXT;

ALTER TABLE discounts ADD COLUMN artStyle TEXT;
ALTER TABLE discounts ADD COLUMN scope TEXT;
ALTER TABLE discounts ADD COLUMN service TEXT;
ALTER TABLE discounts ADD COLUMN colorFinish TEXT;

-- Backfill existing rows so old items show up under the new filters
UPDATE gallery SET artStyle = CASE WHEN category LIKE 'Semi%' THEN 'Semi-Realistic' ELSE 'Chibi' END WHERE artStyle IS NULL;
UPDATE gallery SET service = substr(category, instr(category, '(') + 1, length(category) - instr(category, '(') - 1)
  WHERE (service IS NULL OR service = '') AND category LIKE 'Chibi (%)';
UPDATE products SET artStyle = 'Chibi' WHERE artStyle IS NULL AND category = 'Chibi';
UPDATE discounts SET artStyle = 'Chibi' WHERE artStyle IS NULL AND requirementType = 'Chibi Only';
UPDATE discounts SET artStyle = 'Semi-Realistic' WHERE artStyle IS NULL AND requirementType = 'Semi-Realistic Only';