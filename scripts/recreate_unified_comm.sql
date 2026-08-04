DROP FUNCTION IF EXISTS public.get_unified_communication_history(uuid, integer);
DROP FUNCTION IF EXISTS public.get_unified_communication_history(uuid, uuid, text, integer);

CREATE OR REPLACE FUNCTION public.get_unified_communication_history(
  p_company_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  interaction_id uuid,
  interaction_type text,
  channel text,
  summary text,
  interaction_date timestamp with time zone,
  user_name text
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.type::text,
    i.channel::text,
    COALESCE(i.resumo, i.content)::text,
    i.data_interacao,
    COALESCE(p.full_name, p.email, 'Sistema')::text
  FROM interactions i
  LEFT JOIN profiles p ON p.id = i.user_id
  WHERE i.company_id = p_company_id
  ORDER BY i.data_interacao DESC
  LIMIT p_limit;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_unified_communication_history(uuid, integer) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
