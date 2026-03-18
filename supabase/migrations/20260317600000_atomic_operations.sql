-- Atomic XP increment to avoid race conditions
CREATE OR REPLACE FUNCTION increment_xp(p_player_id uuid, p_amount int)
RETURNS void AS $$
BEGIN
  UPDATE players SET xp = xp + p_amount WHERE id = p_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic stock decrement with validation (returns remaining stock, -1 if insufficient)
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id uuid, p_quantity int)
RETURNS int AS $$
DECLARE
  remaining int;
BEGIN
  UPDATE products SET stock = stock - p_quantity
    WHERE id = p_product_id AND stock >= p_quantity
    RETURNING stock INTO remaining;
  IF remaining IS NULL THEN
    RETURN -1;
  END IF;
  RETURN remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic stock restore (for order cancellation)
CREATE OR REPLACE FUNCTION restore_stock(p_product_id uuid, p_quantity int)
RETURNS void AS $$
BEGIN
  UPDATE products SET stock = stock + p_quantity WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
