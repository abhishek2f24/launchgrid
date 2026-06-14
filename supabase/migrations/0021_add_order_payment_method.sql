-- Migration 0021: Add payment_method to orders
--
-- The mobile app's orders-list query (and Home/Order-detail screens) selects
-- `orders.payment_method` to label COD vs prepaid orders, but the column was
-- never created — so the Orders screen 400s ("column orders.payment_method
-- does not exist"). This adds it back as a nullable text column.
--
-- Purely additive: no existing rows change, no existing behaviour changes.
-- Values used by the app: 'cod' (Cash on Delivery) or 'upi'/'prepaid' (online).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

COMMENT ON COLUMN orders.payment_method IS
  'Buyer-facing payment method: ''cod'' for Cash on Delivery, ''upi''/''prepaid'' for online. NULL = legacy/unknown.';
