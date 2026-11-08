CREATE OR REPLACE FUNCTION public.create_deal(p_company_id uuid, p_titulo text, p_valor numeric DEFAULT 0, p_pipeline_stage text DEFAULT 'lead'::text, p_previsao_fechamento date DEFAULT NULL::date, p_contact_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
