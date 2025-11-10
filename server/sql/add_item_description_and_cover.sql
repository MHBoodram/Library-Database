-- Migration: Add description and cover_image_url to item table
-- Date: 2025-11-08
-- Purpose: Enable librarians to manually add descriptions and cover images for items

ALTER TABLE item 
ADD COLUMN description TEXT AFTER classification,  -- classification is an existing column
ADD COLUMN cover_image_url VARCHAR(500) AFTER description;

-- Add index for faster searches if description is used in search queries
-- (optional, uncomment if needed)
-- CREATE FULLTEXT INDEX idx_item_description ON item(description);
