-- Adds merchant social handles (shown as icons in the storefront footer) and a
-- small set of optional, toggleable storefront sections (announcement/countdown
-- bar, homepage image slider) that merchants can enable/disable and configure
-- without needing a full drag-and-drop page builder.

ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS x_url TEXT;

ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS announcement_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS announcement_text TEXT;
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS announcement_countdown_at TIMESTAMPTZ;

ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS slider_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS slider_images JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN business_configs.slider_images IS 'Array of {image_url, link_url, title} shown as a homepage banner slider when slider_enabled is true.';
