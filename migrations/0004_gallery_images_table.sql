-- Stores additional gallery set images separately so each image stays within D1's row-size limit.
CREATE TABLE IF NOT EXISTS gallery_images (
  galleryId INTEGER NOT NULL,
  position INTEGER NOT NULL,
  data TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  PRIMARY KEY (galleryId, position),
  FOREIGN KEY (galleryId) REFERENCES gallery(id) ON DELETE CASCADE
);
