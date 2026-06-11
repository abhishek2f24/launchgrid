-- Add missing product description, pricing and import source columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url TEXT;
