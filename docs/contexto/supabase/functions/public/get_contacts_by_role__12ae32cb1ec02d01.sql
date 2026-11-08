CREATE OR REPLACE FUNCTION public.get_contacts_by_role()
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
    'total_contatos', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
    'por_cargo', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT
          COALESCE(NULLIF(TRIM(cargo), ''), 'Não informado') as cargo,
          COUNT(*) as total,
          ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL), 0) * 100, 2) as percentual
        FROM contacts
        WHERE deleted_at IS NULL
        GROUP BY COALESCE(NULLIF(TRIM(cargo), ''), 'Não informado')
        ORDER BY COUNT(*) DESC
        LIMIT 20
      ) t
    ),
    'cargos_decisores', (
      SELECT COUNT(*) FROM contacts
      WHERE deleted_at IS NULL
      AND LOWER(cargo) SIMILAR TO '%(diretor|gerente|presidente|ceo|cfo|cto|owner|proprietário|sócio|dono)%'
    ),
    'com_email', (SELECT COUNT(*) FROM contacts WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL),
    'com_telefone', (SELECT COUNT(*) FROM contacts WHERE phone IS NOT NULL AND phone != '' AND deleted_at IS NULL),
    'com_whatsapp', (SELECT COUNT(*) FROM contacts WHERE whatsapp IS NOT NULL AND whatsapp != '' AND deleted_at IS NULL)
  ) INTO result;

  RETURN result;
END;
$function$
