-- Atomic deduct omega_coins with validation (for gacha pulls, store purchases, etc.)
-- Returns remaining coins, -1 if insufficient balance
CREATE OR REPLACE FUNCTION deduct_omega_coins(p_player_id uuid, p_amount int)
RETURNS int AS $$
DECLARE
  remaining int;
BEGIN
  UPDATE players SET omega_coins = omega_coins - p_amount
    WHERE id = p_player_id AND omega_coins >= p_amount
    RETURNING omega_coins INTO remaining;
  IF remaining IS NULL THEN
    RETURN -1;
  END IF;
  RETURN remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic add omega_coins (for mission rewards, tournament prizes, etc.)
-- Returns new balance
CREATE OR REPLACE FUNCTION add_omega_coins(p_player_id uuid, p_amount int)
RETURNS int AS $$
DECLARE
  new_balance int;
BEGIN
  UPDATE players SET omega_coins = omega_coins + p_amount
    WHERE id = p_player_id
    RETURNING omega_coins INTO new_balance;
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
