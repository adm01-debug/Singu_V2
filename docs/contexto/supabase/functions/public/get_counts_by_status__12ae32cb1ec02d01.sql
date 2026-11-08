CREATE OR REPLACE FUNCTION public.get_counts_by_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'empresas', (
      SELECT jsonb_object_agg(COALESCE(status::text, 'null'), cnt)
      FROM (SELECT status, COUNT(*) as cnt FROM companies WHERE deleted_at IS NULL GROUP BY status) t
    ),
    'alertas', (
      SELECT jsonb_object_agg(COALESCE(prioridade, 'null'), cnt)
      FROM (SELECT prioridade, COUNT(*) as cnt FROM alerts WHERE resolved_at IS NULL GROUP BY prioridade) t
    ),
    'interacoes_por_tipo', (
      SELECT jsonb_object_agg(COALESCE(tipo_interacao, 'outros'), cnt)
      FROM (SELECT tipo_interacao, COUNT(*) as cnt FROM interactions WHERE created_at >= now() - interval '30 days' GROUP BY tipo_interacao) t
    )
  );
END;
$function$
