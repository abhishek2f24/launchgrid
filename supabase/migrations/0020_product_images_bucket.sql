-- Migration 0020: public bucket for merchant-uploaded product photos (mobile camera flow)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users upload into their own folder: product-images/{user_id}/...
DROP POLICY IF EXISTS "Users upload own product images" ON storage.objects;
CREATE POLICY "Users upload own product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read (product photos render on storefronts)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-images');
