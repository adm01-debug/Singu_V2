CREATE OR REPLACE FUNCTION public.get_compliance_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'data_quality', jsonb_build_object(
      'companies_without_cnpj', (SELECT COUNT(*) FROM companies WHERE cnpj IS NULL AND status = 'ativo'),
      'companies_without_email', (SELECT COUNT(*) FROM companies WHERE email IS NULL AND status = 'ativo'),
      'contacts_without_email', (SELECT COUNT(*) FROM contacts WHERE email IS NULL),
      'orphan_contacts', (SELECT COUNT(*) FROM contacts c WHERE NOT EXISTS (SELECT 1 FROM companies co WHERE co.id = c.company_id))
    ),
    'lgpd', jsonb_build_object(
      'anonymized_companies', (SELECT COUNT(*) FROM companies WHERE nome_fantasia LIKE 'ANONIMIZADO_%' OR nome_crm LIKE 'ANONIMIZADO_%'),
      'recent_exports', (SELECT COUNT(*) FROM activity_logs WHERE action = 'lgpd_export' AND created_at >= NOW() - interval '30 days'),
      'recent_anonymizations', (SELECT COUNT(*) FROM activity_logs WHERE action = 'lgpd_anonymize' AND created_at >= NOW() - interval '30 days')
    ),
    'activity', jsonb_build_object(
      'total_logs_30d', (SELECT COUNT(*) FROM activity_logs WHERE created_at >= NOW() - interval '30 days'),
      'unique_users_30d', (SELECT COUNT(DISTINCT user_id) FROM activity_logs WHERE created_at >= NOW() - interval '30 days'),
      'actions_breakdown', (
        SELECT COALESCE(jsonb_object_agg(action, cnt), '{}'::jsonb)
        FROM (
          SELECT action, COUNT(*) as cnt 
          FROM activity_logs 
          WHERE created_at >= NOW() - interval '30 days'
          GROUP BY action
          ORDER BY cnt DESC
          LIMIT 10
        ) t
      )
    ),
    'security', jsonb_build_object(
      'rls_policies', (SELECT COUNT(*) FROM pg_policies),
      'users_active', (SELECT COUNT(*) FROM profiles WHERE updated_at >= NOW() - interval '30 days')
    ),
    'generated_at', NOW()
  );
END;
$function$
