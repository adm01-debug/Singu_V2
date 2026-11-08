CREATE OR REPLACE FUNCTION public.create_quick_interaction(p_company_id uuid, p_tipo text, p_resumo text, p_vendedor_id integer DEFAULT NULL::integer, p_followup_dias integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  INSERT INTO interactions (company_id, type, resumo, usuario_responsavel_id,
                            requer_followup, data_followup, follow_up_required, follow_up_date,
                            user_id, created_by)
  VALUES (p_company_id, p_tipo, p_resumo, p_vendedor_id,
          p_followup_dias IS NOT NULL,
          CASE WHEN p_followup_dias IS NOT NULL THEN now() + (p_followup_dias || ' days')::interval END,
          p_followup_dias IS NOT NULL,
          CASE WHEN p_followup_dias IS NOT NULL THEN now() + (p_followup_dias || ' days')::interval END,
          auth.uid(), auth.uid())
  RETURNING id INTO new_id;

  RETURN jsonb_build_object('success', true, 'interaction_id', new_id);
END;
$function$
