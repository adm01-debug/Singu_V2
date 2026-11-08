CREATE OR REPLACE FUNCTION public.get_monthly_seasonality()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'por_mes', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes)
      FROM (
        SELECT 
          EXTRACT(MONTH FROM created_at)::int as mes,
          CASE EXTRACT(MONTH FROM created_at)::int
            WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
          END as mes_nome,
          COUNT(*) as interacoes
        FROM interactions
        WHERE created_at >= now() - interval '12 months'
        GROUP BY EXTRACT(MONTH FROM created_at)::int
      ) t
    ),
    'mes_mais_ativo', (
      SELECT CASE EXTRACT(MONTH FROM created_at)::int
        WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
        WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
        WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
        WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
      END
      FROM interactions
      WHERE created_at >= now() - interval '12 months'
      GROUP BY EXTRACT(MONTH FROM created_at)::int
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
