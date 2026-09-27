-- Record HOW an order was confirmed paid, not just that it was.
--
-- WHY
--   Most LaunchGrid sellers collect through their own UPI ID or QR code. There
--   is no gateway callback in that flow: the buyer pays, the seller sees the
--   money in their UPI app, and clicks "Mark as Paid". Until now that click
--   wrote `payment_status = 'paid'` and nothing else.
--
--   That is fine until a buyer says "I already paid" about an order still
--   showing pending, or says "I never got the goods" about one showing paid.
--   The seller then has a claim and no evidence, because the one number that
--   settles it — the UPI reference / UTR printed on both sides of the
--   transaction — was never stored.
--
--   `paid_at` matters for the same reason: `created_at` is when the order was
--   placed, which for COD and UPI is often a different day from when the money
--   actually arrived.
--
-- Both columns are nullable. Orders confirmed before this migration genuinely
-- have no reference and no recorded payment time, and inventing one — say, by
-- backfilling paid_at from created_at — would turn "unknown" into a precise
-- figure that is simply wrong. Absent data stays absent.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.payment_reference IS
  'UPI reference / UTR, bank reference, or gateway payment id evidencing this payment. Entered by the seller for manual UPI and COD; NULL when unknown.';
COMMENT ON COLUMN orders.paid_at IS
  'When payment was confirmed, which is not the same as created_at for UPI and COD orders. NULL for orders confirmed before this was recorded.';

-- Finding a specific transaction is exactly what this column is for, and it is
-- the query a seller runs while a customer is on the phone. Partial, because
-- the majority of rows are NULL and there is no reason to index those.
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference
  ON orders (tenant_id, payment_reference)
  WHERE payment_reference IS NOT NULL;
