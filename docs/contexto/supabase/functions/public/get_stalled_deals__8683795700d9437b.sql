CREATE OR REPLACE FUNCTION public.get_stalled_deals(p_user_id uuid, p_days integer DEFAULT 14)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$ BEGIN RETURN COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT d.id, d.titulo, d.valor, d.pipeline_stage AS stage, EXTRACT(DAY FROM now() - d.updated_at)::int AS days_stalled, COALESCE(c.nome_fantasia, c.razao_social, '') AS company_name, '' AS contact_name FROM deals d LEFT JOIN companies c ON c.id = d.company_id WHERE d.user_id = p_user_id AND d.status NOT IN ('won','lost') AND d.updated_at < now() - (p_days || ' days')::interval ORDER BY d.updated_at ASC LIMIT 50) t), '[]'::jsonb); END; $function$
