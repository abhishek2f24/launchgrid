-- Adds UPI QR code upload alongside the existing UPI-ID text field, and
-- actually populates the (previously unused) orders.platform_fee_collected
-- column — LaunchGrid never touches customer money on Tier 0 (free_upi) or
-- Tier 1 (byok): the buyer pays the merchant directly. This trigger only
-- computes what LaunchGrid is OWED for later invoicing (per the PRD's
-- "charged via monthly invoice or deducted from wallet" model), it never
-- moves funds. Tier 2 (route) fee-splitting happens inside Razorpay Route
-- itself, so it's intentionally left at 0 here — tracking it a second time
-- here would double-count.

ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS merchant_upi_qr_url TEXT;
COMMENT ON COLUMN business_configs.merchant_upi_qr_url IS 'Merchant-uploaded UPI QR code image, shown on checkout as an alternative to entering a UPI ID.';

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr-codes', 'payment-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own QR codes" ON storage.objects;
CREATE POLICY "Users upload own QR codes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-qr-codes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Public read QR codes" ON storage.objects;
CREATE POLICY "Public read QR codes" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'payment-qr-codes');

CREATE OR REPLACE FUNCTION public.compute_platform_fee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier payment_tier_enum;
  v_fee_pct NUMERIC := 0;
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid') THEN
    SELECT payment_tier INTO v_tier FROM business_configs WHERE tenant_id = NEW.tenant_id;

    v_fee_pct := CASE v_tier
      WHEN 'free_upi' THEN 0.02
      WHEN 'byok' THEN 0.05
      ELSE 0 -- 'route': Razorpay Route splits the fee at settlement time, not tracked again here
    END;

    NEW.platform_fee_collected := ROUND(NEW.total_amount * v_fee_pct, 2);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_platform_fee ON orders;
CREATE TRIGGER trg_compute_platform_fee
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.compute_platform_fee();

-- Orders created already-paid (e.g. some COD-confirmed or webhook-inserted
-- paths) also need the fee computed on INSERT, not just UPDATE.
CREATE OR REPLACE FUNCTION public.compute_platform_fee_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier payment_tier_enum;
  v_fee_pct NUMERIC := 0;
BEGIN
  IF NEW.payment_status = 'paid' THEN
    SELECT payment_tier INTO v_tier FROM business_configs WHERE tenant_id = NEW.tenant_id;
    v_fee_pct := CASE v_tier WHEN 'free_upi' THEN 0.02 WHEN 'byok' THEN 0.05 ELSE 0 END;
    NEW.platform_fee_collected := ROUND(NEW.total_amount * v_fee_pct, 2);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_platform_fee_insert ON orders;
CREATE TRIGGER trg_compute_platform_fee_insert
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION public.compute_platform_fee_on_insert();
