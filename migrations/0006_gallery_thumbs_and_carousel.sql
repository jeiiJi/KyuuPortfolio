-- 1. Gallery columns for lightweight list loading and thumb caching
ALTER TABLE gallery ADD COLUMN thumb TEXT;
ALTER TABLE gallery ADD COLUMN imageVersion INTEGER NOT NULL DEFAULT 1;
ALTER TABLE gallery ADD COLUMN imageCount INTEGER NOT NULL DEFAULT 1 CHECK (imageCount BETWEEN 1 AND 5);

-- 2. Multi-image set table (compatible with 0004). Enforces a maximum of 5 images per entry.
CREATE TABLE IF NOT EXISTS gallery_images (
  galleryId INTEGER NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 4),
  data TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  PRIMARY KEY (galleryId, position),
  FOREIGN KEY (galleryId) REFERENCES gallery(id) ON DELETE CASCADE
);

-- Backfill image counts and thumbnails for existing entries (at least 1, at most 5)
UPDATE gallery
SET imageCount = MAX(1, MIN(5, (CASE WHEN image IS NOT NULL AND image <> '' THEN 1 ELSE 0 END)
               + (SELECT COUNT(*) FROM gallery_images i WHERE i.galleryId = gallery.id))),
    thumb = COALESCE(thumb, image);

-- 3. Dedicated carousel slides table (1 to 5 slides managed independently of the gallery feed)
CREATE TABLE IF NOT EXISTS carousel_slides (
  position INTEGER PRIMARY KEY CHECK (position BETWEEN 0 AND 4),
  data TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  bytes INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

-- Seed initial carousel slides from the latest gallery items (one-time; later managed in admin)
INSERT OR IGNORE INTO carousel_slides (position, data, alt, bytes)
SELECT ROW_NUMBER() OVER (ORDER BY id DESC) - 1,
       image,
       title,
       CAST(LENGTH(image) * 3 / 4 AS INTEGER)
FROM (
  SELECT id, image, title
  FROM gallery
  WHERE image LIKE 'data:image/%'
  ORDER BY id DESC
  LIMIT 5
);