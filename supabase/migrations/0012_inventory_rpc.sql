-- Migration 0012: Add atomic stock decrement RPC functions

CREATE OR REPLACE FUNCTION decrement_variant_stock(v_id UUID, qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock = GREATEST(0, stock - qty)
  WHERE id = v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_product_stock(p_id UUID, qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - qty)
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
