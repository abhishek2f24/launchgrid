ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'zinc';
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS template_style TEXT DEFAULT 'minimal';
