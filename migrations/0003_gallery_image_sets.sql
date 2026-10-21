-- Save as: migrations/0003_gallery_image_sets.sql
-- Run once with:  pnpm exec wrangler d1 migrations apply inkyuu-db --remote
--
-- extraImages holds a JSON array (text) of the additional images in a gallery set.
-- The cover/first image stays in the existing `image` column, so old rows keep working unchanged.
ALTER TABLE gallery ADD COLUMN extraImages TEXT;