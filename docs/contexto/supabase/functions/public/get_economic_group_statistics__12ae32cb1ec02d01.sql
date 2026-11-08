CREATE OR REPLACE FUNCTION public.get_economic_group_statistics()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN json_build_object(
    'total_grupos', (SELECT count(*) FROM grupos_economicos),
    'companies_vinculadas', (SELECT count(*) FROM companies WHERE grupo_economico_id IS NOT NULL),
    'top_grupos', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT 
        g.nome,
        g.tipo,
        count(c.id) as total_companies
      FROM grupos_economicos g
      LEFT JOIN companies c ON c.grupo_economico_id = g.id
      GROUP BY g.nome, g.tipo
      ORDER BY total_companies DESC
      LIMIT 10
    ) t),
    'generated_at', NOW()
  );
END;
$function$
