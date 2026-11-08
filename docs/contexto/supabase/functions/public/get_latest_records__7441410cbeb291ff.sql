CREATE OR REPLACE FUNCTION public.get_latest_records(p_table text DEFAULT 'companies'::text, p_limit integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF p_table = 'companies' THEN
    SELECT jsonb_agg(row_to_json(t))
    INTO result
    FROM (
      SELECT id, nome_crm, cnpj, status, created_at
      FROM companies WHERE deleted_at IS NULL
      ORDER BY created_at DESC LIMIT p_limit
    ) t;
  ELSIF p_table = 'contacts' THEN
    SELECT jsonb_agg(row_to_json(t))
    INTO result
    FROM (
      SELECT id, full_name, email, created_at
      FROM contacts WHERE deleted_at IS NULL
      ORDER BY created_at DESC LIMIT p_limit
    ) t;
  ELSIF p_table = 'interactions' THEN
    SELECT jsonb_agg(row_to_json(t))
    INTO result
    FROM (
      SELECT id, tipo_interacao, canal, created_at
      FROM interactions
      ORDER BY created_at DESC LIMIT p_limit
    ) t;
  ELSE
    result := '[]'::jsonb;
  END IF;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$
