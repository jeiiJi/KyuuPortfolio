-- Save as: migrations/0005_remove_shop_and_discounts.sql
-- Run once with:  pnpm exec wrangler d1 migrations apply inkyuu-db --remote
--
-- Removes the shop (products) and discount features from the database.
-- Deploy the updated worker.js first (or at the same time): the new worker no longer
-- writes the discount columns, so it works both before and after this migration.
--
-- WARNING: this permanently deletes all products, all discount offers, and the
-- discount details stored on past commission requests. Export them first if you
-- want a backup:  pnpm exec wrangler d1 export inkyuu-db --remote --output backup.sql

DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS discounts;

ALTER TABLE commissions DROP COLUMN discountCode;
ALTER TABLE commissions DROP COLUMN discountName;
ALTER TABLE commissions DROP COLUMN discountAmount;