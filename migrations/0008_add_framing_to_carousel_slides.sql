-- Focal point (percent from left/top) and zoom for each hero carousel slide.
ALTER TABLE carousel_slides ADD COLUMN focusX REAL NOT NULL DEFAULT 50;
ALTER TABLE carousel_slides ADD COLUMN focusY REAL NOT NULL DEFAULT 50;
ALTER TABLE carousel_slides ADD COLUMN zoom REAL NOT NULL DEFAULT 1;