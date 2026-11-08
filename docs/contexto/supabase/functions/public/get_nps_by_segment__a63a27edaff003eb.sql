CREATE OR REPLACE FUNCTION public.get_nps_by_segment(p_segment_field text DEFAULT 'uf'::text, p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_segment_field = 'uf' THEN
    RETURN (
      SELECT COALESCE(jsonb_agg(s), '[]')
      FROM (
        SELECT 
          c.uf as segment,
          COUNT(*) as responses,
          ROUND(((COUNT(*) FILTER (WHERE cs.category = 'promoter')::numeric - 
                  COUNT(*) FILTER (WHERE cs.category = 'detractor')::numeric) / 
                 NULLIF(COUNT(*), 0) * 100), 1) as nps
        FROM customer_surveys cs
        JOIN companies c ON c.id = cs.company_id
        WHERE cs.survey_type = 'nps'
          AND cs.responded_at >= CURRENT_DATE - p_days
          AND c.uf IS NOT NULL
        GROUP BY c.uf
        HAVING COUNT(*) >= 3
        ORDER BY nps DESC
      ) s
    );
  ELSE
    RETURN (
      SELECT COALESCE(jsonb_agg(s), '[]')
      FROM (
        SELECT 
          c.ramo_atividade as segment,
          COUNT(*) as responses,
          ROUND(((COUNT(*) FILTER (WHERE cs.category = 'promoter')::numeric - 
                  COUNT(*) FILTER (WHERE cs.category = 'detractor')::numeric) / 
                 NULLIF(COUNT(*), 0) * 100), 1) as nps
        FROM customer_surveys cs
        JOIN companies c ON c.id = cs.company_id
        WHERE cs.survey_type = 'nps'
          AND cs.responded_at >= CURRENT_DATE - p_days
          AND c.ramo_atividade IS NOT NULL
        GROUP BY c.ramo_atividade
        HAVING COUNT(*) >= 3
        ORDER BY nps DESC
      ) s
    );
  END IF;
END;
$function$
