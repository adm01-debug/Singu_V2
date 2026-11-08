CREATE OR REPLACE FUNCTION public.detect_inactive_contacts(dias_inativo integer DEFAULT 90)
 RETURNS TABLE(contact_id uuid, contact_name text, company_name text, last_interaction timestamp with time zone, dias_sem_interacao integer)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    COALESCE(c.first_name, '') || COALESCE(' ' || c.last_name, '') as contact_name,
    comp.razao_social,
    MAX(i.data_interacao) as last_interaction,
    CASE 
      WHEN MAX(i.data_interacao) IS NULL THEN 9999
      ELSE EXTRACT(DAY FROM NOW() - MAX(i.data_interacao))::INTEGER
    END as dias_sem_interacao
  FROM contacts c
  LEFT JOIN companies comp ON comp.id = c.company_id
  LEFT JOIN interactions i ON i.contact_id = c.id
  WHERE c.is_duplicate = false AND c.deleted_at IS NULL
  GROUP BY c.id, c.first_name, c.last_name, comp.razao_social
  HAVING MAX(i.data_interacao) < NOW() - (dias_inativo || ' days')::INTERVAL
     OR MAX(i.data_interacao) IS NULL
  ORDER BY last_interaction ASC NULLS FIRST
  LIMIT 500;
END;
$function$
