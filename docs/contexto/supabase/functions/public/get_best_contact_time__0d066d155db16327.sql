CREATE OR REPLACE FUNCTION public.get_best_contact_time(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
  v_best_hour int;
  v_best_day int;
  v_positive_rate numeric;
BEGIN
  SELECT company_id INTO v_company_id FROM contacts WHERE id = p_contact_id AND deleted_at IS NULL LIMIT 1;
  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('best_hour', 10, 'best_hour_label', 'manhã', 'best_day', 2, 'best_day_label', 'Terça', 'positive_rate', 0, 'recommendation', 'Sem dados do contato');
  END IF;

  SELECT
    MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM data_interacao))::int as best_hour,
    MODE() WITHIN GROUP (ORDER BY EXTRACT(DOW FROM data_interacao))::int as best_day
  INTO v_best_hour, v_best_day
  FROM interactions
  WHERE company_id = v_company_id
    AND sentiment IN ('positive', 'neutral');

  SELECT ROUND(
    COUNT(*) FILTER (WHERE sentiment = 'positive')::numeric /
    NULLIF(COUNT(*), 0)::numeric * 100, 2) INTO v_positive_rate
  FROM interactions
  WHERE company_id = v_company_id;

  RETURN jsonb_build_object(
    'best_hour', COALESCE(v_best_hour, 10),
    'best_hour_label', CASE WHEN COALESCE(v_best_hour, 10) < 12 THEN 'manhã' WHEN COALESCE(v_best_hour, 10) < 18 THEN 'tarde' ELSE 'noite' END,
    'best_day', COALESCE(v_best_day, 2),
    'best_day_label', CASE COALESCE(v_best_day, 2) WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça' WHEN 3 THEN 'Quarta' WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' ELSE 'Sábado' END,
    'positive_rate', COALESCE(v_positive_rate, 0),
    'recommendation', 'Contatar preferencialmente às ' || COALESCE(v_best_hour, 10) || 'h'
  );
END;
$function$
