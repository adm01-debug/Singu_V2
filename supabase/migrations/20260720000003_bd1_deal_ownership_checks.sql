-- BD-1 / SEC-DB: Deal SECURITY DEFINER functions lacked ownership checks.
-- All four mutating deal functions are SECURITY DEFINER, so RLS is bypassed.
-- Without an explicit `user_id = auth.uid()` predicate any authenticated user
-- could move, close, or modify another tenant's deal via direct RPC calls.
--
-- Fixes applied:
--   1. create_deal       — remove caller-supplied p_user_id; always use auth.uid()
--   2. move_deal_to_stage — add AND user_id = auth.uid() to WHERE
--   3. mark_deal_lost     — add AND user_id = auth.uid() to WHERE
--   4. update_deal_status — add AND user_id = auth.uid() to WHERE
--   5. add_item_to_deal   — verify deal ownership before inserting items / updating total

-- 1. create_deal: drop the p_user_id parameter (callers used DEFAULT auth.uid() anyway)
--    Keeps existing callers working — the external-data function passes named params
--    and PostgREST will simply ignore any unknown `user_id` key in the JSON body.
CREATE OR REPLACE FUNCTION public.create_deal(
  p_company_id         uuid,
  p_titulo             text,
  p_valor              numeric              DEFAULT 0,
  p_pipeline_stage     text                 DEFAULT 'lead',
  p_previsao_fechamento date               DEFAULT NULL,
  p_contact_id         uuid                 DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_deal_id   uuid;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'create_deal: unauthenticated call';
  END IF;

  INSERT INTO deals (company_id, contact_id, user_id, titulo, valor, pipeline_stage, previsao_fechamento)
  VALUES (p_company_id, p_contact_id, v_caller_id, p_titulo, p_valor, p_pipeline_stage, p_previsao_fechamento)
  RETURNING id INTO v_deal_id;

  RETURN v_deal_id;
END;
$$;

-- 2. move_deal_to_stage: enforce caller owns the deal
CREATE OR REPLACE FUNCTION public.move_deal_to_stage(
  p_deal_id   uuid,
  p_new_stage text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_old      text;
  v_affected int;
BEGIN
  SELECT pipeline_stage INTO v_old FROM deals WHERE id = p_deal_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal not found or access denied');
  END IF;

  UPDATE deals
  SET pipeline_stage = p_new_stage,
      status = CASE
                 WHEN p_new_stage = 'Ganho'    THEN 'ganho'
                 WHEN p_new_stage = 'Perdido'  THEN 'perdido'
                 ELSE status
               END,
      closed_at  = CASE WHEN p_new_stage IN ('Ganho', 'Perdido') THEN NOW() ELSE closed_at END,
      updated_at = NOW()
  WHERE id = p_deal_id AND user_id = auth.uid();

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal not found or access denied');
  END IF;

  RETURN jsonb_build_object('success', true, 'old_stage', v_old, 'new_stage', p_new_stage);
END;
$$;

-- 3. mark_deal_lost: enforce caller owns the deal
CREATE OR REPLACE FUNCTION public.mark_deal_lost(
  p_deal_id        uuid,
  p_loss_reason_id uuid,
  p_notes          text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE deals
  SET status           = 'perdido',
      loss_reason_id   = p_loss_reason_id,
      motivo_perda     = p_notes,
      closed_at        = NOW(),
      updated_at       = NOW()
  WHERE id = p_deal_id
    AND user_id = auth.uid()
    AND status NOT IN ('ganho', 'perdido');

  RETURN FOUND;
END;
$$;

-- 4. update_deal_status: enforce caller owns the deal
CREATE OR REPLACE FUNCTION public.update_deal_status(
  p_deal_id uuid,
  p_status  text,
  p_motivo  text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE deals
  SET status       = p_status,
      motivo_perda = CASE WHEN p_status = 'perdido' THEN p_motivo ELSE motivo_perda END,
      closed_at    = CASE WHEN p_status IN ('ganho', 'perdido') THEN NOW() ELSE closed_at END,
      updated_at   = NOW()
  WHERE id = p_deal_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- 5. add_item_to_deal: verify deal ownership before mutating deal_items / deals
DO $migration$
BEGIN
  IF to_regclass('public.products') IS NOT NULL
    AND to_regclass('public.deal_items') IS NOT NULL
  THEN
    EXECUTE $function$
      CREATE OR REPLACE FUNCTION public.add_item_to_deal(
        p_deal_id        uuid,
        p_product_id     uuid,
        p_quantity       integer DEFAULT 1,
        p_unit_price     numeric DEFAULT NULL,
        p_discount_percent numeric DEFAULT 0
      )
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = 'public'
      AS $body$
      DECLARE
        v_product  products%ROWTYPE;
        v_item_id  uuid;
        v_price    numeric;
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM deals WHERE id = p_deal_id AND user_id = auth.uid()) THEN
          RETURN jsonb_build_object('success', false, 'error', 'Deal not found or access denied');
        END IF;

        SELECT * INTO v_product FROM products WHERE id = p_product_id;
        IF NOT FOUND THEN
          RETURN jsonb_build_object('success', false, 'error', 'Produto não encontrado');
        END IF;

        v_price := COALESCE(p_unit_price, v_product.unit_price);

        INSERT INTO deal_items (deal_id, product_id, product_name, quantity, unit_price, discount_percent)
        VALUES (p_deal_id, p_product_id, v_product.name, p_quantity, v_price, p_discount_percent)
        RETURNING id INTO v_item_id;

        UPDATE deals
        SET valor = (SELECT COALESCE(SUM(total_price), 0) FROM deal_items WHERE deal_id = p_deal_id)
        WHERE id = p_deal_id AND user_id = auth.uid();

        RETURN jsonb_build_object(
          'success',     true,
          'item_id',     v_item_id,
          'total_price', p_quantity * v_price * (1 - p_discount_percent / 100.0)
        );
      END;
      $body$;
    $function$;
  END IF;
END;
$migration$;
