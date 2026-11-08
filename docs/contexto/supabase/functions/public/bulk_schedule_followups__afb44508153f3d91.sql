CREATE OR REPLACE FUNCTION public.bulk_schedule_followups(p_company_ids uuid[], p_followup_date date, p_followup_type text DEFAULT 'followup'::text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
  v_created int := 0;
  v_user_id uuid := auth.uid();
BEGIN
  FOREACH v_company_id IN ARRAY p_company_ids
  LOOP
    INSERT INTO interactions (company_id, type, resumo, content, follow_up_date, user_id, data_interacao)
    VALUES (v_company_id, 'note', COALESCE(p_notes, 'Followup agendado em lote'), COALESCE(p_notes, 'Followup agendado em lote'), p_followup_date, v_user_id, NOW());
    v_created := v_created + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'scheduled', v_created,
    'followup_date', p_followup_date,
    'followup_type', p_followup_type
  );
END;
$function$
