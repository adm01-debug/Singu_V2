CREATE OR REPLACE FUNCTION public.get_contacts_analysis()
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
    'totais', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'com_email', (SELECT COUNT(*) FROM contacts WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL),
      'com_telefone', (SELECT COUNT(*) FROM contacts WHERE telefone IS NOT NULL AND telefone != '' AND deleted_at IS NULL),
      'com_cargo', (SELECT COUNT(*) FROM contacts WHERE cargo IS NOT NULL AND cargo != '' AND deleted_at IS NULL),
      'com_whatsapp', (SELECT COUNT(*) FROM contacts WHERE whatsapp IS NOT NULL AND whatsapp != '' AND deleted_at IS NULL)
    ),
    'por_cargo', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          COALESCE(UPPER(LEFT(cargo, 1)) || LOWER(SUBSTRING(cargo FROM 2)), 'Não informado') as cargo,
          COUNT(*) as total
        FROM contacts
        WHERE deleted_at IS NULL
        GROUP BY cargo
        ORDER BY COUNT(*) DESC
        LIMIT 15
      ) t
    ),
    'criados_ultimo_mes', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.dia)
      FROM (
        SELECT created_at::date as dia, COUNT(*) as total
        FROM contacts
        WHERE created_at >= now() - interval '30 days'
        AND deleted_at IS NULL
        GROUP BY created_at::date
      ) t
    ),
    'qualidade', jsonb_build_object(
      'completos', (SELECT COUNT(*) FROM contacts WHERE email IS NOT NULL AND telefone IS NOT NULL AND cargo IS NOT NULL AND deleted_at IS NULL),
      'incompletos', (SELECT COUNT(*) FROM contacts WHERE (email IS NULL OR telefone IS NULL OR cargo IS NULL) AND deleted_at IS NULL),
      'taxa_completude', ROUND(
        (SELECT COUNT(*) FROM contacts WHERE email IS NOT NULL AND telefone IS NOT NULL AND cargo IS NOT NULL AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL), 0) * 100, 2
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
