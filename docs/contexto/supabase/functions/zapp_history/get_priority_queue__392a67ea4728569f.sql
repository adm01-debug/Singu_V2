CREATE OR REPLACE FUNCTION zapp_history.get_priority_queue(p_limit integer DEFAULT 20)
 RETURNS TABLE(conversation_id uuid, contato text, whatsapp text, aguardando_min integer, max_lead_score integer, criticidade text, preview text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
  SELECT
    conversation_id, contato, whatsapp, aguardando_min::INT, max_lead_score, criticidade, preview
  FROM zapp_history.v_conversas_aguardando
  ORDER BY
    CASE
      WHEN max_lead_score >= 80 THEN 1
      WHEN max_lead_score >= 60 THEN 2
      WHEN max_lead_score >= 40 THEN 3
      ELSE 4
    END,
    aguardando_min DESC
  LIMIT p_limit;
$function$
