CREATE OR REPLACE FUNCTION public.export_full_backup(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'export_date', NOW(),
    'export_type', 'full_backup',
    'companies', (
      SELECT COALESCE(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
      FROM companies c
      WHERE p_user_id IS NULL OR c.user_id = p_user_id
    ),
    'contacts', (
      SELECT COALESCE(jsonb_agg(to_jsonb(ct)), '[]'::jsonb)
      FROM contacts ct
      JOIN companies c ON c.id = ct.company_id
      WHERE p_user_id IS NULL OR c.user_id = p_user_id
    ),
    'interactions', (
      SELECT COALESCE(jsonb_agg(to_jsonb(i)), '[]'::jsonb)
      FROM interactions i
      WHERE p_user_id IS NULL OR i.user_id = p_user_id
    ),
    'stats', jsonb_build_object(
      'companies_count', (SELECT COUNT(*) FROM companies WHERE p_user_id IS NULL OR user_id = p_user_id),
      'contacts_count', (SELECT COUNT(*) FROM contacts ct JOIN companies c ON c.id = ct.company_id WHERE p_user_id IS NULL OR c.user_id = p_user_id),
      'interactions_count', (SELECT COUNT(*) FROM interactions WHERE p_user_id IS NULL OR user_id = p_user_id)
    )
  );
END;
$function$
