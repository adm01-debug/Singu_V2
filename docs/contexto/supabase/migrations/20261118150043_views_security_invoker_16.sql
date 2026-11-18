-- Migration: views_security_invoker_16
-- Fecha o advisor "security_definer_view" (nivel ERROR) nas 16 views de public.*
-- que ainda rodavam com os privilegios do dono (postgres) em vez dos privilegios
-- de quem consulta. Detalhes, evidencias e rollback: ver o arquivo da migration
-- em supabase/migrations/.
DO $migration$
DECLARE
  v_name text;
  v_total int := 0;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'v_company_summary',
    'v_entities',
    'vw_alertas_pendentes_vendedor',
    'vw_carrier_homologation_queue',
    'vw_carriers',
    'vw_carriers_completo',
    'vw_cliente_completo',
    'vw_clientes_prioridade',
    'vw_companies_completo',
    'vw_company_addresses',
    'vw_contacts_sem_apelido',
    'vw_customers',
    'vw_supplier_homologation_queue',
    'vw_suppliers',
    'vw_suppliers_completo',
    'vw_top_clientes_vendedor'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class
       WHERE oid = to_regclass('public.' || v_name)
         AND relkind = 'v'
    ) THEN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v_name);
      v_total := v_total + 1;
    ELSE
      RAISE NOTICE 'View public.% ausente - ignorada', v_name;
    END IF;
  END LOOP;

  RAISE NOTICE 'security_invoker ligado em % view(s)', v_total;
END
$migration$;
