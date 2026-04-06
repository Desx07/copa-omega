-- Update golden ticket price from 300 to 500
CREATE OR REPLACE FUNCTION purchase_voucher(p_player_id uuid, p_voucher_type text)
RETURNS uuid AS $$
DECLARE
  v_cost int;
  v_discount int;
  v_voucher_id uuid;
  v_new_balance int;
BEGIN
  -- Determine cost and discount
  CASE p_voucher_type
    WHEN 'discount_5' THEN v_cost := 50; v_discount := 5;
    WHEN 'discount_10' THEN v_cost := 100; v_discount := 10;
    WHEN 'discount_15' THEN v_cost := 200; v_discount := 15;
    WHEN 'discount_20' THEN v_cost := 350; v_discount := 20;
    WHEN 'golden_ticket' THEN v_cost := 500; v_discount := NULL;
    ELSE RAISE EXCEPTION 'Invalid voucher type: %', p_voucher_type;
  END CASE;

  -- Deduct from wallet (atomic)
  SELECT wallet_deduct(p_player_id, v_cost, p_voucher_type || '_purchase', 'Compra: ' || p_voucher_type) INTO v_new_balance;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  -- Create voucher
  INSERT INTO player_vouchers (player_id, type, discount_percent, is_used)
  VALUES (p_player_id, p_voucher_type, v_discount, false)
  RETURNING id INTO v_voucher_id;

  RETURN v_voucher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
