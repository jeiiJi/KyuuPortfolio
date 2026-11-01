-- extraImages holds a JSON array (text) of the additional images in a gallery set.
-- The cover/first image stays in the existing `image` column, so old rows keep working unchanged.
ALTER TABLE gallery ADD COLUMN extraImages TEXT;